//! `src/lib/embeddings/vector-embeddings.ts`: the hash-based text embedding
//! the log search compares against, reproduced exactly — 32-bit wrapping
//! string hash over UTF-16 code units, tokens in first-insertion order (the
//! float sums depend on it) — and cosine similarity.
use std::collections::HashSet;

const DIMS: usize = 1536;

/// JS `\s`: whitespace and the line terminators.
fn js_space(c: char) -> bool {
    c.is_whitespace() || c == '\u{feff}'
}

/// `(hash << 5) - hash + char`, then `hash & hash` (to int32), per code unit.
fn js_hash(unit: &[u16]) -> i32 {
    let mut h: i32 = 0;
    for &c in unit {
        let v = i64::from(h.wrapping_shl(5)) - i64::from(h) + i64::from(c);
        #[allow(clippy::cast_possible_truncation)]
        {
            h = v as i32;
        }
    }
    h
}

/// `generateTextEmbedding(text)`.
#[must_use]
pub fn text_embedding(text: &str) -> Vec<f64> {
    let mut v = vec![0.0_f64; DIMS];
    let normalized = text.to_lowercase();
    let normalized = normalized.trim_matches(js_space);
    // "".split(/\s+/) is [""], not [].
    let words: Vec<&str> = if normalized.is_empty() {
        vec![""]
    } else {
        normalized.split(js_space).filter(|w| !w.is_empty()).collect()
    };
    let mut seen: HashSet<Vec<u16>> = HashSet::new();
    let mut tokens: Vec<Vec<u16>> = Vec::new();
    let mut add = |t: Vec<u16>| {
        if seen.insert(t.clone()) {
            tokens.push(t);
        }
    };
    for w in words {
        let units: Vec<u16> = w.encode_utf16().collect();
        add(units.clone());
        for i in 0..units.len().saturating_sub(1) {
            add(units[i..i + 2].to_vec());
        }
    }
    for t in tokens {
        let primary = usize::try_from(i64::from(js_hash(&t)).unsigned_abs() % DIMS as u64).unwrap_or(0);
        let weight = 0.2;
        v[primary] += weight;
        v[(primary + 1) % DIMS] += weight * 0.5;
        v[(primary + DIMS - 1) % DIMS] += weight * 0.5;
    }
    let mut magnitude = v.iter().map(|x| x * x).sum::<f64>().sqrt();
    if magnitude == 0.0 {
        magnitude = 1.0;
    }
    v.iter().map(|x| x / magnitude).collect()
}

/// `generateLogEmbedding(message, component, level)` without metadata.
#[must_use]
pub fn log_embedding(message: &str, component: &str, level: &str) -> Vec<f64> {
    text_embedding(&format!("[{level}] {component}: {message}"))
}

/// `cosineSimilarity`: over the shorter length; 0 for a zero vector.
#[must_use]
pub fn cosine(a: &[f64], b: &[f64]) -> f64 {
    let (mut dot, mut m1, mut m2) = (0.0, 0.0, 0.0);
    for i in 0..a.len().min(b.len()) {
        dot += a[i] * b[i];
        m1 += a[i] * a[i];
        m2 += b[i] * b[i];
    }
    let (m1, m2) = (m1.sqrt(), m2.sqrt());
    if m1 == 0.0 || m2 == 0.0 {
        0.0
    } else {
        dot / (m1 * m2)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn hashes_like_javascript() {
        // "ab": ((0<<5)-0+97)=97; (97<<5)-97+98 = 3105.
        assert_eq!(js_hash(&"ab".encode_utf16().collect::<Vec<_>>()), 3105);
        // Wraps like int32.
        let long: Vec<u16> = "the quick brown fox jumps over".encode_utf16().collect();
        assert_eq!(js_hash(&long), 768_645_004);
    }

    #[test]
    fn unit_vectors_and_similarity() {
        let a = log_embedding("database timeout", "search", "info");
        assert!((a.iter().map(|x| x * x).sum::<f64>() - 1.0).abs() < 1e-12);
        assert!((cosine(&a, &a) - 1.0).abs() < 1e-12);
        assert_eq!(cosine(&a, &[]), 0.0);
        assert_eq!(text_embedding("").iter().filter(|x| **x != 0.0).count(), 3);
    }
}
