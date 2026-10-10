// appwithai-loco.js — the Loco + Astryx application, generated in the tab by the
// real pipeline. Built by scripts/sites/build-site-bundles.ts in app-with-ai-rust
// from language/browser/loco-generator.entry.ts — do not edit.
//   const { files, executables } = await generateLocoApplication({
//     document, modelText, name, assets: await (await fetch('loco-assets.json')).json() });
var __create = Object.create;
var __getProtoOf = Object.getPrototypeOf;
var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __hasOwnProp = Object.prototype.hasOwnProperty;
function __accessProp(key) {
  return this[key];
}
var __toESMCache_node;
var __toESMCache_esm;
var __toESM = (mod, isNodeMode, target) => {
  var canCache = mod != null && typeof mod === "object";
  if (canCache) {
    var cache = isNodeMode ? __toESMCache_node ??= new WeakMap : __toESMCache_esm ??= new WeakMap;
    var cached = cache.get(mod);
    if (cached)
      return cached;
  }
  target = mod != null ? __create(__getProtoOf(mod)) : {};
  const to = isNodeMode || !mod || !mod.__esModule || !__hasOwnProp.call(mod, "default") ? __defProp(target, "default", { value: mod, enumerable: true }) : target;
  if (mod && typeof mod === "object" || typeof mod === "function") {
    for (let key of __getOwnPropNames(mod))
      if (!__hasOwnProp.call(to, key))
        __defProp(to, key, {
          get: __accessProp.bind(mod, key),
          enumerable: true
        });
  }
  if (canCache)
    cache.set(mod, to);
  return to;
};
var __toCommonJS = (from) => {
  var entry = (__moduleCache ??= new WeakMap).get(from), desc;
  if (entry)
    return entry;
  entry = __defProp({}, "__esModule", { value: true });
  if (from && typeof from === "object" || typeof from === "function") {
    for (var key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(entry, key))
        __defProp(entry, key, {
          get: __accessProp.bind(from, key),
          enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable
        });
  }
  __moduleCache.set(from, entry);
  return entry;
};
var __moduleCache;
var __commonJS = (cb, mod) => () => (mod || cb((mod = { exports: {} }).exports, mod), mod.exports);
var __returnValue = (v) => v;
function __exportSetter(name, newValue) {
  this[name] = __returnValue.bind(null, newValue);
}
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, {
      get: all[name],
      enumerable: true,
      configurable: true,
      set: __exportSetter.bind(all, name)
    });
};
var __esm = (fn, res, err) => () => {
  if (fn)
    try {
      res = fn(fn = 0);
    } catch (e) {
      err = [e];
    }
  if (err)
    throw err[0];
  return res;
};

// language/browser/shims/fs.ts
var exports_fs = {};
__export(exports_fs, {
  executables: () => executables,
  existsSync: () => existsSync,
  mount: () => mount,
  promises: () => promises,
  readFileSync: () => readFileSync,
  readdirSync: () => readdirSync,
  snapshot: () => snapshot,
  statSync: () => statSync,
  unmount: () => unmount
});
function normalize(input) {
  const raw = typeof input === "string" ? input : input.pathname;
  const absolute = raw.startsWith("/") ? raw : `/${raw}`;
  const parts = [];
  for (const part of absolute.split("/")) {
    if (part === "" || part === ".")
      continue;
    if (part === "..")
      parts.pop();
    else
      parts.push(part);
  }
  return `/${parts.join("/")}`;
}
function parent(path) {
  const at = path.lastIndexOf("/");
  return at <= 0 ? "/" : path.slice(0, at);
}
function fail(code, syscall, path) {
  const error = new Error(`${code}: ${syscall} '${path}'`);
  error.code = code;
  error.syscall = syscall;
  error.path = path;
  throw error;
}
function ensureDirectory(path) {
  if (directories.has(path))
    return;
  if (files.has(path))
    fail("ENOTDIR", "mkdir", path);
  ensureDirectory(parent(path));
  directories.add(path);
}
function asText(contents) {
  return typeof contents === "string" ? contents : decoder.decode(contents);
}
function asBytes(contents) {
  return typeof contents === "string" ? encoder.encode(contents) : contents;
}
function encodingOf(options) {
  if (typeof options === "string")
    return options;
  if (options && typeof options === "object" && "encoding" in options) {
    return options.encoding ?? undefined;
  }
  return;
}
function read2(path, options) {
  const at = normalize(path);
  const contents = files.get(at);
  if (contents === undefined) {
    if (directories.has(at))
      fail("EISDIR", "read", at);
    fail("ENOENT", "open", at);
  }
  return encodingOf(options) ? asText(contents) : asBytes(contents);
}
function write2(path, data) {
  const at = normalize(path);
  if (directories.has(at))
    fail("EISDIR", "open", at);
  if (!directories.has(parent(at)))
    fail("ENOENT", "open", at);
  files.set(at, typeof data === "string" ? data : new Uint8Array(data));
}
function list(path, options) {
  const at = normalize(path);
  if (!directories.has(at))
    fail(files.has(at) ? "ENOTDIR" : "ENOENT", "scandir", at);
  const prefix = at === "/" ? "/" : `${at}/`;
  const names = new Set;
  for (const key of [...files.keys(), ...directories]) {
    if (key === at || !key.startsWith(prefix))
      continue;
    const rest = key.slice(prefix.length);
    if (rest && !rest.includes("/"))
      names.add(rest);
  }
  const sorted = [...names].sort();
  if (options && typeof options === "object" && options.withFileTypes) {
    return sorted.map((name) => {
      const directory = directories.has(`${prefix}${name}`);
      return {
        name,
        isDirectory: () => directory,
        isFile: () => !directory,
        isSymbolicLink: () => false
      };
    });
  }
  return sorted;
}
function status(path) {
  const at = normalize(path);
  const contents = files.get(at);
  const directory = directories.has(at);
  if (contents === undefined && !directory)
    fail("ENOENT", "stat", at);
  return {
    size: contents === undefined ? 0 : asBytes(contents).byteLength,
    mtime: EPOCH,
    mtimeMs: 0,
    isDirectory: () => directory,
    isFile: () => !directory,
    isSymbolicLink: () => false
  };
}
function remove(path, options) {
  const at = normalize(path);
  const recursive = !!(options && typeof options === "object" && options.recursive);
  const force = !!(options && typeof options === "object" && options.force);
  if (files.delete(at)) {
    modes.delete(at);
    return;
  }
  if (!directories.has(at)) {
    if (force)
      return;
    fail("ENOENT", "rm", at);
  }
  if (!recursive)
    fail("EISDIR", "rm", at);
  const prefix = `${at}/`;
  for (const key of [...files.keys()])
    if (key.startsWith(prefix))
      files.delete(key);
  for (const key of [...modes.keys()])
    if (key.startsWith(prefix))
      modes.delete(key);
  for (const key of [...directories])
    if (key === at || key.startsWith(prefix))
      directories.delete(key);
}
function copyTree(from, to) {
  const source = normalize(from);
  const target = normalize(to);
  if (files.has(source)) {
    ensureDirectory(parent(target));
    files.set(target, files.get(source));
    return;
  }
  if (!directories.has(source))
    fail("ENOENT", "cp", source);
  ensureDirectory(target);
  for (const name of list(source, undefined)) {
    copyTree(`${source}/${name}`, `${target}/${name}`);
  }
}
function existsSync(path) {
  const at = normalize(path);
  return files.has(at) || directories.has(at);
}
function readFileSync(path, options) {
  return read2(typeof path === "string" ? path : path.pathname, options);
}
function mkdirSync(path, options) {
  const at = normalize(path);
  if (options?.recursive)
    ensureDirectory(at);
  else {
    if (existsSync(at))
      fail("EEXIST", "mkdir", at);
    if (!directories.has(parent(at)))
      fail("ENOENT", "mkdir", at);
    directories.add(at);
  }
}
function readdirSync(path, options) {
  return list(path, options);
}
function statSync(path) {
  return status(path);
}
function chmodSync(path, mode) {
  const at = normalize(path);
  if (!files.has(at))
    fail("ENOENT", "chmod", at);
  modes.set(at, mode);
}
function mount(entries) {
  for (const [path, contents] of Object.entries(entries)) {
    const at = normalize(path);
    ensureDirectory(parent(at));
    files.set(at, contents);
  }
}
function snapshot(root) {
  const at = normalize(root);
  const prefix = `${at}/`;
  const out = new Map;
  for (const key of [...files.keys()].sort()) {
    if (key.startsWith(prefix))
      out.set(key.slice(prefix.length), files.get(key));
  }
  return out;
}
function executables(root) {
  const prefix = `${normalize(root)}/`;
  const out = new Set;
  for (const [key, mode] of modes)
    if (key.startsWith(prefix) && mode & 73)
      out.add(key.slice(prefix.length));
  return out;
}
function unmount(root) {
  remove(root, { recursive: true, force: true });
}
var files, directories, modes, encoder, decoder, EPOCH, temporaries = 0, promises, readFile, writeFile, mkdir, readdir, stat, access, copyFile, cp, rm, chmod, mkdtemp;
var init_fs = __esm(() => {
  files = new Map;
  directories = new Set(["/"]);
  modes = new Map;
  encoder = new TextEncoder;
  decoder = new TextDecoder;
  EPOCH = new Date(0);
  promises = {
    async readFile(path, options) {
      return read2(path, options);
    },
    async writeFile(path, data) {
      write2(path, data);
    },
    async mkdir(path, options) {
      mkdirSync(path, options);
    },
    async readdir(path, options) {
      return list(path, options);
    },
    async stat(path) {
      return status(path);
    },
    async access(path) {
      if (!existsSync(path))
        fail("ENOENT", "access", normalize(path));
    },
    async copyFile(from, to) {
      const source = normalize(from);
      const contents = files.get(source);
      if (contents === undefined)
        fail("ENOENT", "copyfile", source);
      write2(to, contents);
    },
    async cp(from, to) {
      copyTree(from, to);
    },
    async rm(path, options) {
      remove(path, options);
    },
    async chmod(path, mode) {
      chmodSync(path, mode);
    },
    async mkdtemp(prefix) {
      temporaries += 1;
      const at = normalize(`${prefix}${temporaries.toString(36).padStart(6, "0")}`);
      ensureDirectory(at);
      return at;
    }
  };
  ({ readFile, writeFile, mkdir, readdir, stat, access, copyFile, cp, rm, chmod, mkdtemp } = promises);
});

// node:path
function assertPath(path) {
  if (typeof path !== "string")
    throw TypeError("Path must be a string. Received " + JSON.stringify(path));
}
function normalizeStringPosix(path, allowAboveRoot) {
  var res = "", lastSegmentLength = 0, lastSlash = -1, dots = 0, code;
  for (var i = 0;i <= path.length; ++i) {
    if (i < path.length)
      code = path.charCodeAt(i);
    else if (code === 47)
      break;
    else
      code = 47;
    if (code === 47) {
      if (lastSlash === i - 1 || dots === 1)
        ;
      else if (lastSlash !== i - 1 && dots === 2) {
        if (res.length < 2 || lastSegmentLength !== 2 || res.charCodeAt(res.length - 1) !== 46 || res.charCodeAt(res.length - 2) !== 46) {
          if (res.length > 2) {
            var lastSlashIndex = res.lastIndexOf("/");
            if (lastSlashIndex !== res.length - 1) {
              if (lastSlashIndex === -1)
                res = "", lastSegmentLength = 0;
              else
                res = res.slice(0, lastSlashIndex), lastSegmentLength = res.length - 1 - res.lastIndexOf("/");
              lastSlash = i, dots = 0;
              continue;
            }
          } else if (res.length === 2 || res.length === 1) {
            res = "", lastSegmentLength = 0, lastSlash = i, dots = 0;
            continue;
          }
        }
        if (allowAboveRoot) {
          if (res.length > 0)
            res += "/..";
          else
            res = "..";
          lastSegmentLength = 2;
        }
      } else {
        if (res.length > 0)
          res += "/" + path.slice(lastSlash + 1, i);
        else
          res = path.slice(lastSlash + 1, i);
        lastSegmentLength = i - lastSlash - 1;
      }
      lastSlash = i, dots = 0;
    } else if (code === 46 && dots !== -1)
      ++dots;
    else
      dots = -1;
  }
  return res;
}
function _format(sep, pathObject) {
  var dir = pathObject.dir || pathObject.root, base = pathObject.base || (pathObject.name || "") + (pathObject.ext || "");
  if (!dir)
    return base;
  if (dir === pathObject.root)
    return dir + base;
  return dir + sep + base;
}
function resolve() {
  var resolvedPath = "", resolvedAbsolute = false, cwd;
  for (var i = arguments.length - 1;i >= -1 && !resolvedAbsolute; i--) {
    var path;
    if (i >= 0)
      path = arguments[i];
    else {
      if (cwd === undefined)
        cwd = process.cwd();
      path = cwd;
    }
    if (assertPath(path), path.length === 0)
      continue;
    resolvedPath = path + "/" + resolvedPath, resolvedAbsolute = path.charCodeAt(0) === 47;
  }
  if (resolvedPath = normalizeStringPosix(resolvedPath, !resolvedAbsolute), resolvedAbsolute)
    if (resolvedPath.length > 0)
      return "/" + resolvedPath;
    else
      return "/";
  else if (resolvedPath.length > 0)
    return resolvedPath;
  else
    return ".";
}
function normalize2(path) {
  if (assertPath(path), path.length === 0)
    return ".";
  var isAbsolute = path.charCodeAt(0) === 47, trailingSeparator = path.charCodeAt(path.length - 1) === 47;
  if (path = normalizeStringPosix(path, !isAbsolute), path.length === 0 && !isAbsolute)
    path = ".";
  if (path.length > 0 && trailingSeparator)
    path += "/";
  if (isAbsolute)
    return "/" + path;
  return path;
}
function isAbsolute(path) {
  return assertPath(path), path.length > 0 && path.charCodeAt(0) === 47;
}
function join() {
  if (arguments.length === 0)
    return ".";
  var joined;
  for (var i = 0;i < arguments.length; ++i) {
    var arg = arguments[i];
    if (assertPath(arg), arg.length > 0)
      if (joined === undefined)
        joined = arg;
      else
        joined += "/" + arg;
  }
  if (joined === undefined)
    return ".";
  return normalize2(joined);
}
function relative(from, to) {
  if (assertPath(from), assertPath(to), from === to)
    return "";
  if (from = resolve(from), to = resolve(to), from === to)
    return "";
  var fromStart = 1;
  for (;fromStart < from.length; ++fromStart)
    if (from.charCodeAt(fromStart) !== 47)
      break;
  var fromEnd = from.length, fromLen = fromEnd - fromStart, toStart = 1;
  for (;toStart < to.length; ++toStart)
    if (to.charCodeAt(toStart) !== 47)
      break;
  var toEnd = to.length, toLen = toEnd - toStart, length = fromLen < toLen ? fromLen : toLen, lastCommonSep = -1, i = 0;
  for (;i <= length; ++i) {
    if (i === length) {
      if (toLen > length) {
        if (to.charCodeAt(toStart + i) === 47)
          return to.slice(toStart + i + 1);
        else if (i === 0)
          return to.slice(toStart + i);
      } else if (fromLen > length) {
        if (from.charCodeAt(fromStart + i) === 47)
          lastCommonSep = i;
        else if (i === 0)
          lastCommonSep = 0;
      }
      break;
    }
    var fromCode = from.charCodeAt(fromStart + i), toCode = to.charCodeAt(toStart + i);
    if (fromCode !== toCode)
      break;
    else if (fromCode === 47)
      lastCommonSep = i;
  }
  var out = "";
  for (i = fromStart + lastCommonSep + 1;i <= fromEnd; ++i)
    if (i === fromEnd || from.charCodeAt(i) === 47)
      if (out.length === 0)
        out += "..";
      else
        out += "/..";
  if (out.length > 0)
    return out + to.slice(toStart + lastCommonSep);
  else {
    if (toStart += lastCommonSep, to.charCodeAt(toStart) === 47)
      ++toStart;
    return to.slice(toStart);
  }
}
function _makeLong(path) {
  return path;
}
function dirname(path) {
  if (assertPath(path), path.length === 0)
    return ".";
  var code = path.charCodeAt(0), hasRoot = code === 47, end = -1, matchedSlash = true;
  for (var i = path.length - 1;i >= 1; --i)
    if (code = path.charCodeAt(i), code === 47) {
      if (!matchedSlash) {
        end = i;
        break;
      }
    } else
      matchedSlash = false;
  if (end === -1)
    return hasRoot ? "/" : ".";
  if (hasRoot && end === 1)
    return "//";
  return path.slice(0, end);
}
function basename(path, ext) {
  if (ext !== undefined && typeof ext !== "string")
    throw TypeError('"ext" argument must be a string');
  assertPath(path);
  var start = 0, end = -1, matchedSlash = true, i;
  if (ext !== undefined && ext.length > 0 && ext.length <= path.length) {
    if (ext.length === path.length && ext === path)
      return "";
    var extIdx = ext.length - 1, firstNonSlashEnd = -1;
    for (i = path.length - 1;i >= 0; --i) {
      var code = path.charCodeAt(i);
      if (code === 47) {
        if (!matchedSlash) {
          start = i + 1;
          break;
        }
      } else {
        if (firstNonSlashEnd === -1)
          matchedSlash = false, firstNonSlashEnd = i + 1;
        if (extIdx >= 0)
          if (code === ext.charCodeAt(extIdx)) {
            if (--extIdx === -1)
              end = i;
          } else
            extIdx = -1, end = firstNonSlashEnd;
      }
    }
    if (start === end)
      end = firstNonSlashEnd;
    else if (end === -1)
      end = path.length;
    return path.slice(start, end);
  } else {
    for (i = path.length - 1;i >= 0; --i)
      if (path.charCodeAt(i) === 47) {
        if (!matchedSlash) {
          start = i + 1;
          break;
        }
      } else if (end === -1)
        matchedSlash = false, end = i + 1;
    if (end === -1)
      return "";
    return path.slice(start, end);
  }
}
function extname(path) {
  assertPath(path);
  var startDot = -1, startPart = 0, end = -1, matchedSlash = true, preDotState = 0;
  for (var i = path.length - 1;i >= 0; --i) {
    var code = path.charCodeAt(i);
    if (code === 47) {
      if (!matchedSlash) {
        startPart = i + 1;
        break;
      }
      continue;
    }
    if (end === -1)
      matchedSlash = false, end = i + 1;
    if (code === 46) {
      if (startDot === -1)
        startDot = i;
      else if (preDotState !== 1)
        preDotState = 1;
    } else if (startDot !== -1)
      preDotState = -1;
  }
  if (startDot === -1 || end === -1 || preDotState === 0 || preDotState === 1 && startDot === end - 1 && startDot === startPart + 1)
    return "";
  return path.slice(startDot, end);
}
function format(pathObject) {
  if (pathObject === null || typeof pathObject !== "object")
    throw TypeError('The "pathObject" argument must be of type Object. Received type ' + typeof pathObject);
  return _format("/", pathObject);
}
function parse(path) {
  assertPath(path);
  var ret = { root: "", dir: "", base: "", ext: "", name: "" };
  if (path.length === 0)
    return ret;
  var code = path.charCodeAt(0), isAbsolute2 = code === 47, start;
  if (isAbsolute2)
    ret.root = "/", start = 1;
  else
    start = 0;
  var startDot = -1, startPart = 0, end = -1, matchedSlash = true, i = path.length - 1, preDotState = 0;
  for (;i >= start; --i) {
    if (code = path.charCodeAt(i), code === 47) {
      if (!matchedSlash) {
        startPart = i + 1;
        break;
      }
      continue;
    }
    if (end === -1)
      matchedSlash = false, end = i + 1;
    if (code === 46) {
      if (startDot === -1)
        startDot = i;
      else if (preDotState !== 1)
        preDotState = 1;
    } else if (startDot !== -1)
      preDotState = -1;
  }
  if (startDot === -1 || end === -1 || preDotState === 0 || preDotState === 1 && startDot === end - 1 && startDot === startPart + 1) {
    if (end !== -1)
      if (startPart === 0 && isAbsolute2)
        ret.base = ret.name = path.slice(1, end);
      else
        ret.base = ret.name = path.slice(startPart, end);
  } else {
    if (startPart === 0 && isAbsolute2)
      ret.name = path.slice(1, startDot), ret.base = path.slice(1, end);
    else
      ret.name = path.slice(startPart, startDot), ret.base = path.slice(startPart, end);
    ret.ext = path.slice(startDot, end);
  }
  if (startPart > 0)
    ret.dir = path.slice(0, startPart - 1);
  else if (isAbsolute2)
    ret.dir = "/";
  return ret;
}
var sep = "/", delimiter = ":", posix, path_default;
var init_path = __esm(() => {
  posix = ((p) => (p.posix = p, p))({ resolve, normalize: normalize2, isAbsolute, join, relative, _makeLong, dirname, basename, extname, format, parse, sep, delimiter, win32: null, posix: null });
  path_default = posix;
});

// node_modules/.bun/quick-format-unescaped@4.0.4/node_modules/quick-format-unescaped/index.js
var require_quick_format_unescaped = __commonJS(function(exports, module) {
  function tryStringify(o) {
    try {
      return JSON.stringify(o);
    } catch (e) {
      return '"[Circular]"';
    }
  }
  module.exports = format;
  function format(f, args, opts) {
    var ss = opts && opts.stringify || tryStringify;
    var offset = 1;
    if (typeof f === "object" && f !== null) {
      var len = args.length + offset;
      if (len === 1)
        return f;
      var objects = new Array(len);
      objects[0] = ss(f);
      for (var index = 1;index < len; index++) {
        objects[index] = ss(args[index]);
      }
      return objects.join(" ");
    }
    if (typeof f !== "string") {
      return f;
    }
    var argLen = args.length;
    if (argLen === 0)
      return f;
    var str = "";
    var a = 1 - offset;
    var lastPos = -1;
    var flen = f && f.length || 0;
    for (var i = 0;i < flen; ) {
      if (f.charCodeAt(i) === 37 && i + 1 < flen) {
        lastPos = lastPos > -1 ? lastPos : 0;
        switch (f.charCodeAt(i + 1)) {
          case 100:
          case 102:
            if (a >= argLen)
              break;
            if (args[a] == null)
              break;
            if (lastPos < i)
              str += f.slice(lastPos, i);
            str += Number(args[a]);
            lastPos = i + 2;
            i++;
            break;
          case 105:
            if (a >= argLen)
              break;
            if (args[a] == null)
              break;
            if (lastPos < i)
              str += f.slice(lastPos, i);
            str += Math.floor(Number(args[a]));
            lastPos = i + 2;
            i++;
            break;
          case 79:
          case 111:
          case 106:
            if (a >= argLen)
              break;
            if (args[a] === undefined)
              break;
            if (lastPos < i)
              str += f.slice(lastPos, i);
            var type = typeof args[a];
            if (type === "string") {
              str += "'" + args[a] + "'";
              lastPos = i + 2;
              i++;
              break;
            }
            if (type === "function") {
              str += args[a].name || "<anonymous>";
              lastPos = i + 2;
              i++;
              break;
            }
            str += ss(args[a]);
            lastPos = i + 2;
            i++;
            break;
          case 115:
            if (a >= argLen)
              break;
            if (lastPos < i)
              str += f.slice(lastPos, i);
            str += String(args[a]);
            lastPos = i + 2;
            i++;
            break;
          case 37:
            if (lastPos < i)
              str += f.slice(lastPos, i);
            str += "%";
            lastPos = i + 2;
            i++;
            a--;
            break;
        }
        ++a;
      }
      ++i;
    }
    if (lastPos === -1)
      return f;
    else if (lastPos < flen) {
      str += f.slice(lastPos);
    }
    return str;
  }
});

// node_modules/.bun/pino@9.14.0/node_modules/pino/browser.js
var require_browser = __commonJS(function(exports, module) {
  var format = require_quick_format_unescaped();
  module.exports = pino;
  var _console = pfGlobalThisOrFallback().console || {};
  var stdSerializers = {
    mapHttpRequest: mock,
    mapHttpResponse: mock,
    wrapRequestSerializer: passthrough,
    wrapResponseSerializer: passthrough,
    wrapErrorSerializer: passthrough,
    req: mock,
    res: mock,
    err: asErrValue,
    errWithCause: asErrValue
  };
  function levelToValue(level, logger) {
    return level === "silent" ? Infinity : logger.levels.values[level];
  }
  var baseLogFunctionSymbol = Symbol("pino.logFuncs");
  var hierarchySymbol = Symbol("pino.hierarchy");
  var logFallbackMap = {
    error: "log",
    fatal: "error",
    warn: "error",
    info: "log",
    debug: "log",
    trace: "log"
  };
  function appendChildLogger(parentLogger, childLogger) {
    const newEntry = {
      logger: childLogger,
      parent: parentLogger[hierarchySymbol]
    };
    childLogger[hierarchySymbol] = newEntry;
  }
  function setupBaseLogFunctions(logger, levels, proto) {
    const logFunctions = {};
    levels.forEach((level) => {
      logFunctions[level] = proto[level] ? proto[level] : _console[level] || _console[logFallbackMap[level] || "log"] || noop;
    });
    logger[baseLogFunctionSymbol] = logFunctions;
  }
  function shouldSerialize(serialize, serializers) {
    if (Array.isArray(serialize)) {
      const hasToFilter = serialize.filter(function(k) {
        return k !== "!stdSerializers.err";
      });
      return hasToFilter;
    } else if (serialize === true) {
      return Object.keys(serializers);
    }
    return false;
  }
  function pino(opts) {
    opts = opts || {};
    opts.browser = opts.browser || {};
    const transmit = opts.browser.transmit;
    if (transmit && typeof transmit.send !== "function") {
      throw Error("pino: transmit option must have a send function");
    }
    const proto = opts.browser.write || _console;
    if (opts.browser.write)
      opts.browser.asObject = true;
    const serializers = opts.serializers || {};
    const serialize = shouldSerialize(opts.browser.serialize, serializers);
    let stdErrSerialize = opts.browser.serialize;
    if (Array.isArray(opts.browser.serialize) && opts.browser.serialize.indexOf("!stdSerializers.err") > -1)
      stdErrSerialize = false;
    const customLevels = Object.keys(opts.customLevels || {});
    const levels = ["error", "fatal", "warn", "info", "debug", "trace"].concat(customLevels);
    if (typeof proto === "function") {
      levels.forEach(function(level) {
        proto[level] = proto;
      });
    }
    if (opts.enabled === false || opts.browser.disabled)
      opts.level = "silent";
    const level = opts.level || "info";
    const logger = Object.create(proto);
    if (!logger.log)
      logger.log = noop;
    setupBaseLogFunctions(logger, levels, proto);
    appendChildLogger({}, logger);
    Object.defineProperty(logger, "levelVal", {
      get: getLevelVal
    });
    Object.defineProperty(logger, "level", {
      get: getLevel,
      set: setLevel
    });
    const setOpts = {
      transmit,
      serialize,
      asObject: opts.browser.asObject,
      asObjectBindingsOnly: opts.browser.asObjectBindingsOnly,
      formatters: opts.browser.formatters,
      levels,
      timestamp: getTimeFunction(opts),
      messageKey: opts.messageKey || "msg",
      onChild: opts.onChild || noop
    };
    logger.levels = getLevels(opts);
    logger.level = level;
    logger.isLevelEnabled = function(level) {
      if (!this.levels.values[level]) {
        return false;
      }
      return this.levels.values[level] >= this.levels.values[this.level];
    };
    logger.setMaxListeners = logger.getMaxListeners = logger.emit = logger.addListener = logger.on = logger.prependListener = logger.once = logger.prependOnceListener = logger.removeListener = logger.removeAllListeners = logger.listeners = logger.listenerCount = logger.eventNames = logger.write = logger.flush = noop;
    logger.serializers = serializers;
    logger._serialize = serialize;
    logger._stdErrSerialize = stdErrSerialize;
    logger.child = function(...args) {
      return child.call(this, setOpts, ...args);
    };
    if (transmit)
      logger._logEvent = createLogEventShape();
    function getLevelVal() {
      return levelToValue(this.level, this);
    }
    function getLevel() {
      return this._level;
    }
    function setLevel(level) {
      if (level !== "silent" && !this.levels.values[level]) {
        throw Error("unknown level " + level);
      }
      this._level = level;
      set(this, setOpts, logger, "error");
      set(this, setOpts, logger, "fatal");
      set(this, setOpts, logger, "warn");
      set(this, setOpts, logger, "info");
      set(this, setOpts, logger, "debug");
      set(this, setOpts, logger, "trace");
      customLevels.forEach((level) => {
        set(this, setOpts, logger, level);
      });
    }
    function child(setOpts, bindings, childOptions) {
      if (!bindings) {
        throw new Error("missing bindings for child Pino");
      }
      childOptions = childOptions || {};
      if (serialize && bindings.serializers) {
        childOptions.serializers = bindings.serializers;
      }
      const childOptionsSerializers = childOptions.serializers;
      if (serialize && childOptionsSerializers) {
        var childSerializers = Object.assign({}, serializers, childOptionsSerializers);
        var childSerialize = opts.browser.serialize === true ? Object.keys(childSerializers) : serialize;
        delete bindings.serializers;
        applySerializers([bindings], childSerialize, childSerializers, this._stdErrSerialize);
      }
      function Child(parent) {
        this._childLevel = (parent._childLevel | 0) + 1;
        this.bindings = bindings;
        if (childSerializers) {
          this.serializers = childSerializers;
          this._serialize = childSerialize;
        }
        if (transmit) {
          this._logEvent = createLogEventShape([].concat(parent._logEvent.bindings, bindings));
        }
      }
      Child.prototype = this;
      const newLogger = new Child(this);
      appendChildLogger(this, newLogger);
      newLogger.child = function(...args) {
        return child.call(this, setOpts, ...args);
      };
      newLogger.level = childOptions.level || this.level;
      setOpts.onChild(newLogger);
      return newLogger;
    }
    return logger;
  }
  function getLevels(opts) {
    const customLevels = opts.customLevels || {};
    const values = Object.assign({}, pino.levels.values, customLevels);
    const labels = Object.assign({}, pino.levels.labels, invertObject(customLevels));
    return {
      values,
      labels
    };
  }
  function invertObject(obj) {
    const inverted = {};
    Object.keys(obj).forEach(function(key) {
      inverted[obj[key]] = key;
    });
    return inverted;
  }
  pino.levels = {
    values: {
      fatal: 60,
      error: 50,
      warn: 40,
      info: 30,
      debug: 20,
      trace: 10
    },
    labels: {
      10: "trace",
      20: "debug",
      30: "info",
      40: "warn",
      50: "error",
      60: "fatal"
    }
  };
  pino.stdSerializers = stdSerializers;
  pino.stdTimeFunctions = Object.assign({}, { nullTime, epochTime, unixTime, isoTime });
  function getBindingChain(logger) {
    const bindings = [];
    if (logger.bindings) {
      bindings.push(logger.bindings);
    }
    let hierarchy = logger[hierarchySymbol];
    while (hierarchy.parent) {
      hierarchy = hierarchy.parent;
      if (hierarchy.logger.bindings) {
        bindings.push(hierarchy.logger.bindings);
      }
    }
    return bindings.reverse();
  }
  function set(self2, opts, rootLogger, level) {
    Object.defineProperty(self2, level, {
      value: levelToValue(self2.level, rootLogger) > levelToValue(level, rootLogger) ? noop : rootLogger[baseLogFunctionSymbol][level],
      writable: true,
      enumerable: true,
      configurable: true
    });
    if (self2[level] === noop) {
      if (!opts.transmit)
        return;
      const transmitLevel = opts.transmit.level || self2.level;
      const transmitValue = levelToValue(transmitLevel, rootLogger);
      const methodValue = levelToValue(level, rootLogger);
      if (methodValue < transmitValue)
        return;
    }
    self2[level] = createWrap(self2, opts, rootLogger, level);
    const bindings = getBindingChain(self2);
    if (bindings.length === 0) {
      return;
    }
    self2[level] = prependBindingsInArguments(bindings, self2[level]);
  }
  function prependBindingsInArguments(bindings, logFunc) {
    return function() {
      return logFunc.apply(this, [...bindings, ...arguments]);
    };
  }
  function createWrap(self2, opts, rootLogger, level) {
    return function(write) {
      return function LOG() {
        const ts = opts.timestamp();
        const args = new Array(arguments.length);
        const proto = Object.getPrototypeOf && Object.getPrototypeOf(this) === _console ? _console : this;
        for (var i = 0;i < args.length; i++)
          args[i] = arguments[i];
        var argsIsSerialized = false;
        if (opts.serialize) {
          applySerializers(args, this._serialize, this.serializers, this._stdErrSerialize);
          argsIsSerialized = true;
        }
        if (opts.asObject || opts.formatters) {
          write.call(proto, ...asObject(this, level, args, ts, opts));
        } else
          write.apply(proto, args);
        if (opts.transmit) {
          const transmitLevel = opts.transmit.level || self2._level;
          const transmitValue = levelToValue(transmitLevel, rootLogger);
          const methodValue = levelToValue(level, rootLogger);
          if (methodValue < transmitValue)
            return;
          transmit(this, {
            ts,
            methodLevel: level,
            methodValue,
            transmitLevel,
            transmitValue: rootLogger.levels.values[opts.transmit.level || self2._level],
            send: opts.transmit.send,
            val: levelToValue(self2._level, rootLogger)
          }, args, argsIsSerialized);
        }
      };
    }(self2[baseLogFunctionSymbol][level]);
  }
  function asObject(logger, level, args, ts, opts) {
    const {
      level: levelFormatter,
      log: logObjectFormatter = (obj) => obj
    } = opts.formatters || {};
    const argsCloned = args.slice();
    let msg = argsCloned[0];
    const logObject = {};
    let lvl = (logger._childLevel | 0) + 1;
    if (lvl < 1)
      lvl = 1;
    if (ts) {
      logObject.time = ts;
    }
    if (levelFormatter) {
      const formattedLevel = levelFormatter(level, logger.levels.values[level]);
      Object.assign(logObject, formattedLevel);
    } else {
      logObject.level = logger.levels.values[level];
    }
    if (opts.asObjectBindingsOnly) {
      if (msg !== null && typeof msg === "object") {
        while (lvl-- && typeof argsCloned[0] === "object") {
          Object.assign(logObject, argsCloned.shift());
        }
      }
      const formattedLogObject = logObjectFormatter(logObject);
      return [formattedLogObject, ...argsCloned];
    } else {
      if (msg !== null && typeof msg === "object") {
        while (lvl-- && typeof argsCloned[0] === "object") {
          Object.assign(logObject, argsCloned.shift());
        }
        msg = argsCloned.length ? format(argsCloned.shift(), argsCloned) : undefined;
      } else if (typeof msg === "string")
        msg = format(argsCloned.shift(), argsCloned);
      if (msg !== undefined)
        logObject[opts.messageKey] = msg;
      const formattedLogObject = logObjectFormatter(logObject);
      return [formattedLogObject];
    }
  }
  function applySerializers(args, serialize, serializers, stdErrSerialize) {
    for (const i in args) {
      if (stdErrSerialize && args[i] instanceof Error) {
        args[i] = pino.stdSerializers.err(args[i]);
      } else if (typeof args[i] === "object" && !Array.isArray(args[i]) && serialize) {
        for (const k in args[i]) {
          if (serialize.indexOf(k) > -1 && k in serializers) {
            args[i][k] = serializers[k](args[i][k]);
          }
        }
      }
    }
  }
  function transmit(logger, opts, args, argsIsSerialized = false) {
    const send = opts.send;
    const ts = opts.ts;
    const methodLevel = opts.methodLevel;
    const methodValue = opts.methodValue;
    const val = opts.val;
    const bindings = logger._logEvent.bindings;
    if (!argsIsSerialized) {
      applySerializers(args, logger._serialize || Object.keys(logger.serializers), logger.serializers, logger._stdErrSerialize === undefined ? true : logger._stdErrSerialize);
    }
    logger._logEvent.ts = ts;
    logger._logEvent.messages = args.filter(function(arg) {
      return bindings.indexOf(arg) === -1;
    });
    logger._logEvent.level.label = methodLevel;
    logger._logEvent.level.value = methodValue;
    send(methodLevel, logger._logEvent, val);
    logger._logEvent = createLogEventShape(bindings);
  }
  function createLogEventShape(bindings) {
    return {
      ts: 0,
      messages: [],
      bindings: bindings || [],
      level: { label: "", value: 0 }
    };
  }
  function asErrValue(err) {
    const obj = {
      type: err.constructor.name,
      msg: err.message,
      stack: err.stack
    };
    for (const key in err) {
      if (obj[key] === undefined) {
        obj[key] = err[key];
      }
    }
    return obj;
  }
  function getTimeFunction(opts) {
    if (typeof opts.timestamp === "function") {
      return opts.timestamp;
    }
    if (opts.timestamp === false) {
      return nullTime;
    }
    return epochTime;
  }
  function mock() {
    return {};
  }
  function passthrough(a) {
    return a;
  }
  function noop() {}
  function nullTime() {
    return false;
  }
  function epochTime() {
    return Date.now();
  }
  function unixTime() {
    return Math.round(Date.now() / 1000);
  }
  function isoTime() {
    return new Date(Date.now()).toISOString();
  }
  function pfGlobalThisOrFallback() {
    function defd(o) {
      return typeof o !== "undefined" && o;
    }
    try {
      if (typeof globalThis !== "undefined")
        return globalThis;
      Object.defineProperty(Object.prototype, "globalThis", {
        get: function() {
          delete Object.prototype.globalThis;
          return this.globalThis = this;
        },
        configurable: true
      });
      return globalThis;
    } catch (e) {
      return defd(self) || defd(window) || defd(this) || {};
    }
  }
  module.exports.default = pino;
  module.exports.pino = pino;
});

// node_modules/.bun/zod@3.25.76/node_modules/zod/v3/helpers/util.js
var util, objectUtil, ZodParsedType, getParsedType = (data) => {
  const t = typeof data;
  switch (t) {
    case "undefined":
      return ZodParsedType.undefined;
    case "string":
      return ZodParsedType.string;
    case "number":
      return Number.isNaN(data) ? ZodParsedType.nan : ZodParsedType.number;
    case "boolean":
      return ZodParsedType.boolean;
    case "function":
      return ZodParsedType.function;
    case "bigint":
      return ZodParsedType.bigint;
    case "symbol":
      return ZodParsedType.symbol;
    case "object":
      if (Array.isArray(data)) {
        return ZodParsedType.array;
      }
      if (data === null) {
        return ZodParsedType.null;
      }
      if (data.then && typeof data.then === "function" && data.catch && typeof data.catch === "function") {
        return ZodParsedType.promise;
      }
      if (typeof Map !== "undefined" && data instanceof Map) {
        return ZodParsedType.map;
      }
      if (typeof Set !== "undefined" && data instanceof Set) {
        return ZodParsedType.set;
      }
      if (typeof Date !== "undefined" && data instanceof Date) {
        return ZodParsedType.date;
      }
      return ZodParsedType.object;
    default:
      return ZodParsedType.unknown;
  }
};
var init_util = __esm(() => {
  (function(util) {
    util.assertEqual = (_) => {};
    function assertIs(_arg) {}
    util.assertIs = assertIs;
    function assertNever(_x) {
      throw new Error;
    }
    util.assertNever = assertNever;
    util.arrayToEnum = (items) => {
      const obj = {};
      for (const item of items) {
        obj[item] = item;
      }
      return obj;
    };
    util.getValidEnumValues = (obj) => {
      const validKeys = util.objectKeys(obj).filter((k) => typeof obj[obj[k]] !== "number");
      const filtered = {};
      for (const k of validKeys) {
        filtered[k] = obj[k];
      }
      return util.objectValues(filtered);
    };
    util.objectValues = (obj) => {
      return util.objectKeys(obj).map(function(e) {
        return obj[e];
      });
    };
    util.objectKeys = typeof Object.keys === "function" ? (obj) => Object.keys(obj) : (object) => {
      const keys = [];
      for (const key in object) {
        if (Object.prototype.hasOwnProperty.call(object, key)) {
          keys.push(key);
        }
      }
      return keys;
    };
    util.find = (arr, checker) => {
      for (const item of arr) {
        if (checker(item))
          return item;
      }
      return;
    };
    util.isInteger = typeof Number.isInteger === "function" ? (val) => Number.isInteger(val) : (val) => typeof val === "number" && Number.isFinite(val) && Math.floor(val) === val;
    function joinValues(array, separator = " | ") {
      return array.map((val) => typeof val === "string" ? `'${val}'` : val).join(separator);
    }
    util.joinValues = joinValues;
    util.jsonStringifyReplacer = (_, value) => {
      if (typeof value === "bigint") {
        return value.toString();
      }
      return value;
    };
  })(util || (util = {}));
  (function(objectUtil) {
    objectUtil.mergeShapes = (first, second) => {
      return {
        ...first,
        ...second
      };
    };
  })(objectUtil || (objectUtil = {}));
  ZodParsedType = util.arrayToEnum([
    "string",
    "nan",
    "number",
    "integer",
    "float",
    "boolean",
    "date",
    "bigint",
    "symbol",
    "function",
    "undefined",
    "null",
    "array",
    "object",
    "unknown",
    "promise",
    "void",
    "never",
    "map",
    "set"
  ]);
});

// node_modules/.bun/zod@3.25.76/node_modules/zod/v3/ZodError.js
var ZodIssueCode, ZodError;
var init_ZodError = __esm(() => {
  init_util();
  ZodIssueCode = util.arrayToEnum([
    "invalid_type",
    "invalid_literal",
    "custom",
    "invalid_union",
    "invalid_union_discriminator",
    "invalid_enum_value",
    "unrecognized_keys",
    "invalid_arguments",
    "invalid_return_type",
    "invalid_date",
    "invalid_string",
    "too_small",
    "too_big",
    "invalid_intersection_types",
    "not_multiple_of",
    "not_finite"
  ]);
  ZodError = class ZodError extends Error {
    get errors() {
      return this.issues;
    }
    constructor(issues) {
      super();
      this.issues = [];
      this.addIssue = (sub) => {
        this.issues = [...this.issues, sub];
      };
      this.addIssues = (subs = []) => {
        this.issues = [...this.issues, ...subs];
      };
      const actualProto = new.target.prototype;
      if (Object.setPrototypeOf) {
        Object.setPrototypeOf(this, actualProto);
      } else {
        this.__proto__ = actualProto;
      }
      this.name = "ZodError";
      this.issues = issues;
    }
    format(_mapper) {
      const mapper = _mapper || function(issue) {
        return issue.message;
      };
      const fieldErrors = { _errors: [] };
      const processError = (error) => {
        for (const issue of error.issues) {
          if (issue.code === "invalid_union") {
            issue.unionErrors.map(processError);
          } else if (issue.code === "invalid_return_type") {
            processError(issue.returnTypeError);
          } else if (issue.code === "invalid_arguments") {
            processError(issue.argumentsError);
          } else if (issue.path.length === 0) {
            fieldErrors._errors.push(mapper(issue));
          } else {
            let curr = fieldErrors;
            let i = 0;
            while (i < issue.path.length) {
              const el = issue.path[i];
              const terminal = i === issue.path.length - 1;
              if (!terminal) {
                curr[el] = curr[el] || { _errors: [] };
              } else {
                curr[el] = curr[el] || { _errors: [] };
                curr[el]._errors.push(mapper(issue));
              }
              curr = curr[el];
              i++;
            }
          }
        }
      };
      processError(this);
      return fieldErrors;
    }
    static assert(value) {
      if (!(value instanceof ZodError)) {
        throw new Error(`Not a ZodError: ${value}`);
      }
    }
    toString() {
      return this.message;
    }
    get message() {
      return JSON.stringify(this.issues, util.jsonStringifyReplacer, 2);
    }
    get isEmpty() {
      return this.issues.length === 0;
    }
    flatten(mapper = (issue) => issue.message) {
      const fieldErrors = {};
      const formErrors = [];
      for (const sub of this.issues) {
        if (sub.path.length > 0) {
          const firstEl = sub.path[0];
          fieldErrors[firstEl] = fieldErrors[firstEl] || [];
          fieldErrors[firstEl].push(mapper(sub));
        } else {
          formErrors.push(mapper(sub));
        }
      }
      return { formErrors, fieldErrors };
    }
    get formErrors() {
      return this.flatten();
    }
  };
  ZodError.create = (issues) => {
    const error = new ZodError(issues);
    return error;
  };
});

// node_modules/.bun/zod@3.25.76/node_modules/zod/v3/locales/en.js
var errorMap = (issue, _ctx) => {
  let message;
  switch (issue.code) {
    case ZodIssueCode.invalid_type:
      if (issue.received === ZodParsedType.undefined) {
        message = "Required";
      } else {
        message = `Expected ${issue.expected}, received ${issue.received}`;
      }
      break;
    case ZodIssueCode.invalid_literal:
      message = `Invalid literal value, expected ${JSON.stringify(issue.expected, util.jsonStringifyReplacer)}`;
      break;
    case ZodIssueCode.unrecognized_keys:
      message = `Unrecognized key(s) in object: ${util.joinValues(issue.keys, ", ")}`;
      break;
    case ZodIssueCode.invalid_union:
      message = `Invalid input`;
      break;
    case ZodIssueCode.invalid_union_discriminator:
      message = `Invalid discriminator value. Expected ${util.joinValues(issue.options)}`;
      break;
    case ZodIssueCode.invalid_enum_value:
      message = `Invalid enum value. Expected ${util.joinValues(issue.options)}, received '${issue.received}'`;
      break;
    case ZodIssueCode.invalid_arguments:
      message = `Invalid function arguments`;
      break;
    case ZodIssueCode.invalid_return_type:
      message = `Invalid function return type`;
      break;
    case ZodIssueCode.invalid_date:
      message = `Invalid date`;
      break;
    case ZodIssueCode.invalid_string:
      if (typeof issue.validation === "object") {
        if ("includes" in issue.validation) {
          message = `Invalid input: must include "${issue.validation.includes}"`;
          if (typeof issue.validation.position === "number") {
            message = `${message} at one or more positions greater than or equal to ${issue.validation.position}`;
          }
        } else if ("startsWith" in issue.validation) {
          message = `Invalid input: must start with "${issue.validation.startsWith}"`;
        } else if ("endsWith" in issue.validation) {
          message = `Invalid input: must end with "${issue.validation.endsWith}"`;
        } else {
          util.assertNever(issue.validation);
        }
      } else if (issue.validation !== "regex") {
        message = `Invalid ${issue.validation}`;
      } else {
        message = "Invalid";
      }
      break;
    case ZodIssueCode.too_small:
      if (issue.type === "array")
        message = `Array must contain ${issue.exact ? "exactly" : issue.inclusive ? `at least` : `more than`} ${issue.minimum} element(s)`;
      else if (issue.type === "string")
        message = `String must contain ${issue.exact ? "exactly" : issue.inclusive ? `at least` : `over`} ${issue.minimum} character(s)`;
      else if (issue.type === "number")
        message = `Number must be ${issue.exact ? `exactly equal to ` : issue.inclusive ? `greater than or equal to ` : `greater than `}${issue.minimum}`;
      else if (issue.type === "bigint")
        message = `Number must be ${issue.exact ? `exactly equal to ` : issue.inclusive ? `greater than or equal to ` : `greater than `}${issue.minimum}`;
      else if (issue.type === "date")
        message = `Date must be ${issue.exact ? `exactly equal to ` : issue.inclusive ? `greater than or equal to ` : `greater than `}${new Date(Number(issue.minimum))}`;
      else
        message = "Invalid input";
      break;
    case ZodIssueCode.too_big:
      if (issue.type === "array")
        message = `Array must contain ${issue.exact ? `exactly` : issue.inclusive ? `at most` : `less than`} ${issue.maximum} element(s)`;
      else if (issue.type === "string")
        message = `String must contain ${issue.exact ? `exactly` : issue.inclusive ? `at most` : `under`} ${issue.maximum} character(s)`;
      else if (issue.type === "number")
        message = `Number must be ${issue.exact ? `exactly` : issue.inclusive ? `less than or equal to` : `less than`} ${issue.maximum}`;
      else if (issue.type === "bigint")
        message = `BigInt must be ${issue.exact ? `exactly` : issue.inclusive ? `less than or equal to` : `less than`} ${issue.maximum}`;
      else if (issue.type === "date")
        message = `Date must be ${issue.exact ? `exactly` : issue.inclusive ? `smaller than or equal to` : `smaller than`} ${new Date(Number(issue.maximum))}`;
      else
        message = "Invalid input";
      break;
    case ZodIssueCode.custom:
      message = `Invalid input`;
      break;
    case ZodIssueCode.invalid_intersection_types:
      message = `Intersection results could not be merged`;
      break;
    case ZodIssueCode.not_multiple_of:
      message = `Number must be a multiple of ${issue.multipleOf}`;
      break;
    case ZodIssueCode.not_finite:
      message = "Number must be finite";
      break;
    default:
      message = _ctx.defaultError;
      util.assertNever(issue);
  }
  return { message };
}, en_default;
var init_en = __esm(() => {
  init_ZodError();
  init_util();
  en_default = errorMap;
});

// node_modules/.bun/zod@3.25.76/node_modules/zod/v3/errors.js
function getErrorMap() {
  return overrideErrorMap;
}
var overrideErrorMap;
var init_errors = __esm(() => {
  init_en();
  overrideErrorMap = en_default;
});

// node_modules/.bun/zod@3.25.76/node_modules/zod/v3/helpers/parseUtil.js
function addIssueToContext(ctx, issueData) {
  const overrideMap = getErrorMap();
  const issue = makeIssue({
    issueData,
    data: ctx.data,
    path: ctx.path,
    errorMaps: [
      ctx.common.contextualErrorMap,
      ctx.schemaErrorMap,
      overrideMap,
      overrideMap === en_default ? undefined : en_default
    ].filter((x) => !!x)
  });
  ctx.common.issues.push(issue);
}

class ParseStatus {
  constructor() {
    this.value = "valid";
  }
  dirty() {
    if (this.value === "valid")
      this.value = "dirty";
  }
  abort() {
    if (this.value !== "aborted")
      this.value = "aborted";
  }
  static mergeArray(status, results) {
    const arrayValue = [];
    for (const s of results) {
      if (s.status === "aborted")
        return INVALID;
      if (s.status === "dirty")
        status.dirty();
      arrayValue.push(s.value);
    }
    return { status: status.value, value: arrayValue };
  }
  static async mergeObjectAsync(status, pairs) {
    const syncPairs = [];
    for (const pair of pairs) {
      const key = await pair.key;
      const value = await pair.value;
      syncPairs.push({
        key,
        value
      });
    }
    return ParseStatus.mergeObjectSync(status, syncPairs);
  }
  static mergeObjectSync(status, pairs) {
    const finalObject = {};
    for (const pair of pairs) {
      const { key, value } = pair;
      if (key.status === "aborted")
        return INVALID;
      if (value.status === "aborted")
        return INVALID;
      if (key.status === "dirty")
        status.dirty();
      if (value.status === "dirty")
        status.dirty();
      if (key.value !== "__proto__" && (typeof value.value !== "undefined" || pair.alwaysSet)) {
        finalObject[key.value] = value.value;
      }
    }
    return { status: status.value, value: finalObject };
  }
}
var makeIssue = (params) => {
  const { data, path, errorMaps, issueData } = params;
  const fullPath = [...path, ...issueData.path || []];
  const fullIssue = {
    ...issueData,
    path: fullPath
  };
  if (issueData.message !== undefined) {
    return {
      ...issueData,
      path: fullPath,
      message: issueData.message
    };
  }
  let errorMessage = "";
  const maps = errorMaps.filter((m) => !!m).slice().reverse();
  for (const map of maps) {
    errorMessage = map(fullIssue, { data, defaultError: errorMessage }).message;
  }
  return {
    ...issueData,
    path: fullPath,
    message: errorMessage
  };
}, INVALID, DIRTY = (value) => ({ status: "dirty", value }), OK = (value) => ({ status: "valid", value }), isAborted = (x) => x.status === "aborted", isDirty = (x) => x.status === "dirty", isValid = (x) => x.status === "valid", isAsync = (x) => typeof Promise !== "undefined" && x instanceof Promise;
var init_parseUtil = __esm(() => {
  init_errors();
  init_en();
  INVALID = Object.freeze({
    status: "aborted"
  });
});

// node_modules/.bun/zod@3.25.76/node_modules/zod/v3/helpers/typeAliases.js
var init_typeAliases = () => {};

// node_modules/.bun/zod@3.25.76/node_modules/zod/v3/helpers/errorUtil.js
var errorUtil;
var init_errorUtil = __esm(() => {
  (function(errorUtil) {
    errorUtil.errToObj = (message) => typeof message === "string" ? { message } : message || {};
    errorUtil.toString = (message) => typeof message === "string" ? message : message?.message;
  })(errorUtil || (errorUtil = {}));
});

// node_modules/.bun/zod@3.25.76/node_modules/zod/v3/types.js
class ParseInputLazyPath {
  constructor(parent, value, path, key) {
    this._cachedPath = [];
    this.parent = parent;
    this.data = value;
    this._path = path;
    this._key = key;
  }
  get path() {
    if (!this._cachedPath.length) {
      if (Array.isArray(this._key)) {
        this._cachedPath.push(...this._path, ...this._key);
      } else {
        this._cachedPath.push(...this._path, this._key);
      }
    }
    return this._cachedPath;
  }
}
function processCreateParams(params) {
  if (!params)
    return {};
  const { errorMap, invalid_type_error, required_error, description } = params;
  if (errorMap && (invalid_type_error || required_error)) {
    throw new Error(`Can't use "invalid_type_error" or "required_error" in conjunction with custom error map.`);
  }
  if (errorMap)
    return { errorMap, description };
  const customMap = (iss, ctx) => {
    const { message } = params;
    if (iss.code === "invalid_enum_value") {
      return { message: message ?? ctx.defaultError };
    }
    if (typeof ctx.data === "undefined") {
      return { message: message ?? required_error ?? ctx.defaultError };
    }
    if (iss.code !== "invalid_type")
      return { message: ctx.defaultError };
    return { message: message ?? invalid_type_error ?? ctx.defaultError };
  };
  return { errorMap: customMap, description };
}

class ZodType {
  get description() {
    return this._def.description;
  }
  _getType(input) {
    return getParsedType(input.data);
  }
  _getOrReturnCtx(input, ctx) {
    return ctx || {
      common: input.parent.common,
      data: input.data,
      parsedType: getParsedType(input.data),
      schemaErrorMap: this._def.errorMap,
      path: input.path,
      parent: input.parent
    };
  }
  _processInputParams(input) {
    return {
      status: new ParseStatus,
      ctx: {
        common: input.parent.common,
        data: input.data,
        parsedType: getParsedType(input.data),
        schemaErrorMap: this._def.errorMap,
        path: input.path,
        parent: input.parent
      }
    };
  }
  _parseSync(input) {
    const result = this._parse(input);
    if (isAsync(result)) {
      throw new Error("Synchronous parse encountered promise.");
    }
    return result;
  }
  _parseAsync(input) {
    const result = this._parse(input);
    return Promise.resolve(result);
  }
  parse(data, params) {
    const result = this.safeParse(data, params);
    if (result.success)
      return result.data;
    throw result.error;
  }
  safeParse(data, params) {
    const ctx = {
      common: {
        issues: [],
        async: params?.async ?? false,
        contextualErrorMap: params?.errorMap
      },
      path: params?.path || [],
      schemaErrorMap: this._def.errorMap,
      parent: null,
      data,
      parsedType: getParsedType(data)
    };
    const result = this._parseSync({ data, path: ctx.path, parent: ctx });
    return handleResult(ctx, result);
  }
  "~validate"(data) {
    const ctx = {
      common: {
        issues: [],
        async: !!this["~standard"].async
      },
      path: [],
      schemaErrorMap: this._def.errorMap,
      parent: null,
      data,
      parsedType: getParsedType(data)
    };
    if (!this["~standard"].async) {
      try {
        const result = this._parseSync({ data, path: [], parent: ctx });
        return isValid(result) ? {
          value: result.value
        } : {
          issues: ctx.common.issues
        };
      } catch (err) {
        if (err?.message?.toLowerCase()?.includes("encountered")) {
          this["~standard"].async = true;
        }
        ctx.common = {
          issues: [],
          async: true
        };
      }
    }
    return this._parseAsync({ data, path: [], parent: ctx }).then((result) => isValid(result) ? {
      value: result.value
    } : {
      issues: ctx.common.issues
    });
  }
  async parseAsync(data, params) {
    const result = await this.safeParseAsync(data, params);
    if (result.success)
      return result.data;
    throw result.error;
  }
  async safeParseAsync(data, params) {
    const ctx = {
      common: {
        issues: [],
        contextualErrorMap: params?.errorMap,
        async: true
      },
      path: params?.path || [],
      schemaErrorMap: this._def.errorMap,
      parent: null,
      data,
      parsedType: getParsedType(data)
    };
    const maybeAsyncResult = this._parse({ data, path: ctx.path, parent: ctx });
    const result = await (isAsync(maybeAsyncResult) ? maybeAsyncResult : Promise.resolve(maybeAsyncResult));
    return handleResult(ctx, result);
  }
  refine(check, message) {
    const getIssueProperties = (val) => {
      if (typeof message === "string" || typeof message === "undefined") {
        return { message };
      } else if (typeof message === "function") {
        return message(val);
      } else {
        return message;
      }
    };
    return this._refinement((val, ctx) => {
      const result = check(val);
      const setError = () => ctx.addIssue({
        code: ZodIssueCode.custom,
        ...getIssueProperties(val)
      });
      if (typeof Promise !== "undefined" && result instanceof Promise) {
        return result.then((data) => {
          if (!data) {
            setError();
            return false;
          } else {
            return true;
          }
        });
      }
      if (!result) {
        setError();
        return false;
      } else {
        return true;
      }
    });
  }
  refinement(check, refinementData) {
    return this._refinement((val, ctx) => {
      if (!check(val)) {
        ctx.addIssue(typeof refinementData === "function" ? refinementData(val, ctx) : refinementData);
        return false;
      } else {
        return true;
      }
    });
  }
  _refinement(refinement) {
    return new ZodEffects({
      schema: this,
      typeName: ZodFirstPartyTypeKind.ZodEffects,
      effect: { type: "refinement", refinement }
    });
  }
  superRefine(refinement) {
    return this._refinement(refinement);
  }
  constructor(def) {
    this.spa = this.safeParseAsync;
    this._def = def;
    this.parse = this.parse.bind(this);
    this.safeParse = this.safeParse.bind(this);
    this.parseAsync = this.parseAsync.bind(this);
    this.safeParseAsync = this.safeParseAsync.bind(this);
    this.spa = this.spa.bind(this);
    this.refine = this.refine.bind(this);
    this.refinement = this.refinement.bind(this);
    this.superRefine = this.superRefine.bind(this);
    this.optional = this.optional.bind(this);
    this.nullable = this.nullable.bind(this);
    this.nullish = this.nullish.bind(this);
    this.array = this.array.bind(this);
    this.promise = this.promise.bind(this);
    this.or = this.or.bind(this);
    this.and = this.and.bind(this);
    this.transform = this.transform.bind(this);
    this.brand = this.brand.bind(this);
    this.default = this.default.bind(this);
    this.catch = this.catch.bind(this);
    this.describe = this.describe.bind(this);
    this.pipe = this.pipe.bind(this);
    this.readonly = this.readonly.bind(this);
    this.isNullable = this.isNullable.bind(this);
    this.isOptional = this.isOptional.bind(this);
    this["~standard"] = {
      version: 1,
      vendor: "zod",
      validate: (data) => this["~validate"](data)
    };
  }
  optional() {
    return ZodOptional.create(this, this._def);
  }
  nullable() {
    return ZodNullable.create(this, this._def);
  }
  nullish() {
    return this.nullable().optional();
  }
  array() {
    return ZodArray.create(this);
  }
  promise() {
    return ZodPromise.create(this, this._def);
  }
  or(option) {
    return ZodUnion.create([this, option], this._def);
  }
  and(incoming) {
    return ZodIntersection.create(this, incoming, this._def);
  }
  transform(transform) {
    return new ZodEffects({
      ...processCreateParams(this._def),
      schema: this,
      typeName: ZodFirstPartyTypeKind.ZodEffects,
      effect: { type: "transform", transform }
    });
  }
  default(def) {
    const defaultValueFunc = typeof def === "function" ? def : () => def;
    return new ZodDefault({
      ...processCreateParams(this._def),
      innerType: this,
      defaultValue: defaultValueFunc,
      typeName: ZodFirstPartyTypeKind.ZodDefault
    });
  }
  brand() {
    return new ZodBranded({
      typeName: ZodFirstPartyTypeKind.ZodBranded,
      type: this,
      ...processCreateParams(this._def)
    });
  }
  catch(def) {
    const catchValueFunc = typeof def === "function" ? def : () => def;
    return new ZodCatch({
      ...processCreateParams(this._def),
      innerType: this,
      catchValue: catchValueFunc,
      typeName: ZodFirstPartyTypeKind.ZodCatch
    });
  }
  describe(description) {
    const This = this.constructor;
    return new This({
      ...this._def,
      description
    });
  }
  pipe(target) {
    return ZodPipeline.create(this, target);
  }
  readonly() {
    return ZodReadonly.create(this);
  }
  isOptional() {
    return this.safeParse(undefined).success;
  }
  isNullable() {
    return this.safeParse(null).success;
  }
}
function timeRegexSource(args) {
  let secondsRegexSource = `[0-5]\\d`;
  if (args.precision) {
    secondsRegexSource = `${secondsRegexSource}\\.\\d{${args.precision}}`;
  } else if (args.precision == null) {
    secondsRegexSource = `${secondsRegexSource}(\\.\\d+)?`;
  }
  const secondsQuantifier = args.precision ? "+" : "?";
  return `([01]\\d|2[0-3]):[0-5]\\d(:${secondsRegexSource})${secondsQuantifier}`;
}
function timeRegex(args) {
  return new RegExp(`^${timeRegexSource(args)}$`);
}
function datetimeRegex(args) {
  let regex = `${dateRegexSource}T${timeRegexSource(args)}`;
  const opts = [];
  opts.push(args.local ? `Z?` : `Z`);
  if (args.offset)
    opts.push(`([+-]\\d{2}:?\\d{2})`);
  regex = `${regex}(${opts.join("|")})`;
  return new RegExp(`^${regex}$`);
}
function isValidIP(ip, version) {
  if ((version === "v4" || !version) && ipv4Regex.test(ip)) {
    return true;
  }
  if ((version === "v6" || !version) && ipv6Regex.test(ip)) {
    return true;
  }
  return false;
}
function isValidJWT(jwt, alg) {
  if (!jwtRegex.test(jwt))
    return false;
  try {
    const [header] = jwt.split(".");
    if (!header)
      return false;
    const base64 = header.replace(/-/g, "+").replace(/_/g, "/").padEnd(header.length + (4 - header.length % 4) % 4, "=");
    const decoded = JSON.parse(atob(base64));
    if (typeof decoded !== "object" || decoded === null)
      return false;
    if ("typ" in decoded && decoded?.typ !== "JWT")
      return false;
    if (!decoded.alg)
      return false;
    if (alg && decoded.alg !== alg)
      return false;
    return true;
  } catch {
    return false;
  }
}
function isValidCidr(ip, version) {
  if ((version === "v4" || !version) && ipv4CidrRegex.test(ip)) {
    return true;
  }
  if ((version === "v6" || !version) && ipv6CidrRegex.test(ip)) {
    return true;
  }
  return false;
}
function floatSafeRemainder(val, step) {
  const valDecCount = (val.toString().split(".")[1] || "").length;
  const stepDecCount = (step.toString().split(".")[1] || "").length;
  const decCount = valDecCount > stepDecCount ? valDecCount : stepDecCount;
  const valInt = Number.parseInt(val.toFixed(decCount).replace(".", ""));
  const stepInt = Number.parseInt(step.toFixed(decCount).replace(".", ""));
  return valInt % stepInt / 10 ** decCount;
}
function deepPartialify(schema) {
  if (schema instanceof ZodObject) {
    const newShape = {};
    for (const key in schema.shape) {
      const fieldSchema = schema.shape[key];
      newShape[key] = ZodOptional.create(deepPartialify(fieldSchema));
    }
    return new ZodObject({
      ...schema._def,
      shape: () => newShape
    });
  } else if (schema instanceof ZodArray) {
    return new ZodArray({
      ...schema._def,
      type: deepPartialify(schema.element)
    });
  } else if (schema instanceof ZodOptional) {
    return ZodOptional.create(deepPartialify(schema.unwrap()));
  } else if (schema instanceof ZodNullable) {
    return ZodNullable.create(deepPartialify(schema.unwrap()));
  } else if (schema instanceof ZodTuple) {
    return ZodTuple.create(schema.items.map((item) => deepPartialify(item)));
  } else {
    return schema;
  }
}
function mergeValues(a, b) {
  const aType = getParsedType(a);
  const bType = getParsedType(b);
  if (a === b) {
    return { valid: true, data: a };
  } else if (aType === ZodParsedType.object && bType === ZodParsedType.object) {
    const bKeys = util.objectKeys(b);
    const sharedKeys = util.objectKeys(a).filter((key) => bKeys.indexOf(key) !== -1);
    const newObj = { ...a, ...b };
    for (const key of sharedKeys) {
      const sharedValue = mergeValues(a[key], b[key]);
      if (!sharedValue.valid) {
        return { valid: false };
      }
      newObj[key] = sharedValue.data;
    }
    return { valid: true, data: newObj };
  } else if (aType === ZodParsedType.array && bType === ZodParsedType.array) {
    if (a.length !== b.length) {
      return { valid: false };
    }
    const newArray = [];
    for (let index = 0;index < a.length; index++) {
      const itemA = a[index];
      const itemB = b[index];
      const sharedValue = mergeValues(itemA, itemB);
      if (!sharedValue.valid) {
        return { valid: false };
      }
      newArray.push(sharedValue.data);
    }
    return { valid: true, data: newArray };
  } else if (aType === ZodParsedType.date && bType === ZodParsedType.date && +a === +b) {
    return { valid: true, data: a };
  } else {
    return { valid: false };
  }
}
function createZodEnum(values, params) {
  return new ZodEnum({
    values,
    typeName: ZodFirstPartyTypeKind.ZodEnum,
    ...processCreateParams(params)
  });
}
var handleResult = (ctx, result) => {
  if (isValid(result)) {
    return { success: true, data: result.value };
  } else {
    if (!ctx.common.issues.length) {
      throw new Error("Validation failed but no issues detected.");
    }
    return {
      success: false,
      get error() {
        if (this._error)
          return this._error;
        const error = new ZodError(ctx.common.issues);
        this._error = error;
        return this._error;
      }
    };
  }
}, cuidRegex, cuid2Regex, ulidRegex, uuidRegex, nanoidRegex, jwtRegex, durationRegex, emailRegex, _emojiRegex = `^(\\p{Extended_Pictographic}|\\p{Emoji_Component})+$`, emojiRegex, ipv4Regex, ipv4CidrRegex, ipv6Regex, ipv6CidrRegex, base64Regex, base64urlRegex, dateRegexSource = `((\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-((0[13578]|1[02])-(0[1-9]|[12]\\d|3[01])|(0[469]|11)-(0[1-9]|[12]\\d|30)|(02)-(0[1-9]|1\\d|2[0-8])))`, dateRegex, ZodString, ZodNumber, ZodBigInt, ZodBoolean, ZodDate, ZodSymbol, ZodUndefined, ZodNull, ZodAny, ZodUnknown, ZodNever, ZodVoid, ZodArray, ZodObject, ZodUnion, getDiscriminator = (type) => {
  if (type instanceof ZodLazy) {
    return getDiscriminator(type.schema);
  } else if (type instanceof ZodEffects) {
    return getDiscriminator(type.innerType());
  } else if (type instanceof ZodLiteral) {
    return [type.value];
  } else if (type instanceof ZodEnum) {
    return type.options;
  } else if (type instanceof ZodNativeEnum) {
    return util.objectValues(type.enum);
  } else if (type instanceof ZodDefault) {
    return getDiscriminator(type._def.innerType);
  } else if (type instanceof ZodUndefined) {
    return [undefined];
  } else if (type instanceof ZodNull) {
    return [null];
  } else if (type instanceof ZodOptional) {
    return [undefined, ...getDiscriminator(type.unwrap())];
  } else if (type instanceof ZodNullable) {
    return [null, ...getDiscriminator(type.unwrap())];
  } else if (type instanceof ZodBranded) {
    return getDiscriminator(type.unwrap());
  } else if (type instanceof ZodReadonly) {
    return getDiscriminator(type.unwrap());
  } else if (type instanceof ZodCatch) {
    return getDiscriminator(type._def.innerType);
  } else {
    return [];
  }
}, ZodDiscriminatedUnion, ZodIntersection, ZodTuple, ZodRecord, ZodMap, ZodSet, ZodFunction, ZodLazy, ZodLiteral, ZodEnum, ZodNativeEnum, ZodPromise, ZodEffects, ZodOptional, ZodNullable, ZodDefault, ZodCatch, ZodNaN, BRAND, ZodBranded, ZodPipeline, ZodReadonly, late, ZodFirstPartyTypeKind, stringType, numberType, nanType, bigIntType, booleanType, dateType, symbolType, undefinedType, nullType, anyType, unknownType, neverType, voidType, arrayType, objectType, strictObjectType, unionType, discriminatedUnionType, intersectionType, tupleType, recordType, mapType, setType, functionType, lazyType, literalType, enumType, nativeEnumType, promiseType, effectsType, optionalType, nullableType, preprocessType, pipelineType;
var init_types = __esm(() => {
  init_ZodError();
  init_errors();
  init_errorUtil();
  init_parseUtil();
  init_util();
  cuidRegex = /^c[^\s-]{8,}$/i;
  cuid2Regex = /^[0-9a-z]+$/;
  ulidRegex = /^[0-9A-HJKMNP-TV-Z]{26}$/i;
  uuidRegex = /^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/i;
  nanoidRegex = /^[a-z0-9_-]{21}$/i;
  jwtRegex = /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]*$/;
  durationRegex = /^[-+]?P(?!$)(?:(?:[-+]?\d+Y)|(?:[-+]?\d+[.,]\d+Y$))?(?:(?:[-+]?\d+M)|(?:[-+]?\d+[.,]\d+M$))?(?:(?:[-+]?\d+W)|(?:[-+]?\d+[.,]\d+W$))?(?:(?:[-+]?\d+D)|(?:[-+]?\d+[.,]\d+D$))?(?:T(?=[\d+-])(?:(?:[-+]?\d+H)|(?:[-+]?\d+[.,]\d+H$))?(?:(?:[-+]?\d+M)|(?:[-+]?\d+[.,]\d+M$))?(?:[-+]?\d+(?:[.,]\d+)?S)?)??$/;
  emailRegex = /^(?!\.)(?!.*\.\.)([A-Z0-9_'+\-\.]*)[A-Z0-9_+-]@([A-Z0-9][A-Z0-9\-]*\.)+[A-Z]{2,}$/i;
  ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])$/;
  ipv4CidrRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\/(3[0-2]|[12]?[0-9])$/;
  ipv6Regex = /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))$/;
  ipv6CidrRegex = /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))\/(12[0-8]|1[01][0-9]|[1-9]?[0-9])$/;
  base64Regex = /^([0-9a-zA-Z+/]{4})*(([0-9a-zA-Z+/]{2}==)|([0-9a-zA-Z+/]{3}=))?$/;
  base64urlRegex = /^([0-9a-zA-Z-_]{4})*(([0-9a-zA-Z-_]{2}(==)?)|([0-9a-zA-Z-_]{3}(=)?))?$/;
  dateRegex = new RegExp(`^${dateRegexSource}$`);
  ZodString = class ZodString extends ZodType {
    _parse(input) {
      if (this._def.coerce) {
        input.data = String(input.data);
      }
      const parsedType = this._getType(input);
      if (parsedType !== ZodParsedType.string) {
        const ctx = this._getOrReturnCtx(input);
        addIssueToContext(ctx, {
          code: ZodIssueCode.invalid_type,
          expected: ZodParsedType.string,
          received: ctx.parsedType
        });
        return INVALID;
      }
      const status = new ParseStatus;
      let ctx = undefined;
      for (const check of this._def.checks) {
        if (check.kind === "min") {
          if (input.data.length < check.value) {
            ctx = this._getOrReturnCtx(input, ctx);
            addIssueToContext(ctx, {
              code: ZodIssueCode.too_small,
              minimum: check.value,
              type: "string",
              inclusive: true,
              exact: false,
              message: check.message
            });
            status.dirty();
          }
        } else if (check.kind === "max") {
          if (input.data.length > check.value) {
            ctx = this._getOrReturnCtx(input, ctx);
            addIssueToContext(ctx, {
              code: ZodIssueCode.too_big,
              maximum: check.value,
              type: "string",
              inclusive: true,
              exact: false,
              message: check.message
            });
            status.dirty();
          }
        } else if (check.kind === "length") {
          const tooBig = input.data.length > check.value;
          const tooSmall = input.data.length < check.value;
          if (tooBig || tooSmall) {
            ctx = this._getOrReturnCtx(input, ctx);
            if (tooBig) {
              addIssueToContext(ctx, {
                code: ZodIssueCode.too_big,
                maximum: check.value,
                type: "string",
                inclusive: true,
                exact: true,
                message: check.message
              });
            } else if (tooSmall) {
              addIssueToContext(ctx, {
                code: ZodIssueCode.too_small,
                minimum: check.value,
                type: "string",
                inclusive: true,
                exact: true,
                message: check.message
              });
            }
            status.dirty();
          }
        } else if (check.kind === "email") {
          if (!emailRegex.test(input.data)) {
            ctx = this._getOrReturnCtx(input, ctx);
            addIssueToContext(ctx, {
              validation: "email",
              code: ZodIssueCode.invalid_string,
              message: check.message
            });
            status.dirty();
          }
        } else if (check.kind === "emoji") {
          if (!emojiRegex) {
            emojiRegex = new RegExp(_emojiRegex, "u");
          }
          if (!emojiRegex.test(input.data)) {
            ctx = this._getOrReturnCtx(input, ctx);
            addIssueToContext(ctx, {
              validation: "emoji",
              code: ZodIssueCode.invalid_string,
              message: check.message
            });
            status.dirty();
          }
        } else if (check.kind === "uuid") {
          if (!uuidRegex.test(input.data)) {
            ctx = this._getOrReturnCtx(input, ctx);
            addIssueToContext(ctx, {
              validation: "uuid",
              code: ZodIssueCode.invalid_string,
              message: check.message
            });
            status.dirty();
          }
        } else if (check.kind === "nanoid") {
          if (!nanoidRegex.test(input.data)) {
            ctx = this._getOrReturnCtx(input, ctx);
            addIssueToContext(ctx, {
              validation: "nanoid",
              code: ZodIssueCode.invalid_string,
              message: check.message
            });
            status.dirty();
          }
        } else if (check.kind === "cuid") {
          if (!cuidRegex.test(input.data)) {
            ctx = this._getOrReturnCtx(input, ctx);
            addIssueToContext(ctx, {
              validation: "cuid",
              code: ZodIssueCode.invalid_string,
              message: check.message
            });
            status.dirty();
          }
        } else if (check.kind === "cuid2") {
          if (!cuid2Regex.test(input.data)) {
            ctx = this._getOrReturnCtx(input, ctx);
            addIssueToContext(ctx, {
              validation: "cuid2",
              code: ZodIssueCode.invalid_string,
              message: check.message
            });
            status.dirty();
          }
        } else if (check.kind === "ulid") {
          if (!ulidRegex.test(input.data)) {
            ctx = this._getOrReturnCtx(input, ctx);
            addIssueToContext(ctx, {
              validation: "ulid",
              code: ZodIssueCode.invalid_string,
              message: check.message
            });
            status.dirty();
          }
        } else if (check.kind === "url") {
          try {
            new URL(input.data);
          } catch {
            ctx = this._getOrReturnCtx(input, ctx);
            addIssueToContext(ctx, {
              validation: "url",
              code: ZodIssueCode.invalid_string,
              message: check.message
            });
            status.dirty();
          }
        } else if (check.kind === "regex") {
          check.regex.lastIndex = 0;
          const testResult = check.regex.test(input.data);
          if (!testResult) {
            ctx = this._getOrReturnCtx(input, ctx);
            addIssueToContext(ctx, {
              validation: "regex",
              code: ZodIssueCode.invalid_string,
              message: check.message
            });
            status.dirty();
          }
        } else if (check.kind === "trim") {
          input.data = input.data.trim();
        } else if (check.kind === "includes") {
          if (!input.data.includes(check.value, check.position)) {
            ctx = this._getOrReturnCtx(input, ctx);
            addIssueToContext(ctx, {
              code: ZodIssueCode.invalid_string,
              validation: { includes: check.value, position: check.position },
              message: check.message
            });
            status.dirty();
          }
        } else if (check.kind === "toLowerCase") {
          input.data = input.data.toLowerCase();
        } else if (check.kind === "toUpperCase") {
          input.data = input.data.toUpperCase();
        } else if (check.kind === "startsWith") {
          if (!input.data.startsWith(check.value)) {
            ctx = this._getOrReturnCtx(input, ctx);
            addIssueToContext(ctx, {
              code: ZodIssueCode.invalid_string,
              validation: { startsWith: check.value },
              message: check.message
            });
            status.dirty();
          }
        } else if (check.kind === "endsWith") {
          if (!input.data.endsWith(check.value)) {
            ctx = this._getOrReturnCtx(input, ctx);
            addIssueToContext(ctx, {
              code: ZodIssueCode.invalid_string,
              validation: { endsWith: check.value },
              message: check.message
            });
            status.dirty();
          }
        } else if (check.kind === "datetime") {
          const regex = datetimeRegex(check);
          if (!regex.test(input.data)) {
            ctx = this._getOrReturnCtx(input, ctx);
            addIssueToContext(ctx, {
              code: ZodIssueCode.invalid_string,
              validation: "datetime",
              message: check.message
            });
            status.dirty();
          }
        } else if (check.kind === "date") {
          const regex = dateRegex;
          if (!regex.test(input.data)) {
            ctx = this._getOrReturnCtx(input, ctx);
            addIssueToContext(ctx, {
              code: ZodIssueCode.invalid_string,
              validation: "date",
              message: check.message
            });
            status.dirty();
          }
        } else if (check.kind === "time") {
          const regex = timeRegex(check);
          if (!regex.test(input.data)) {
            ctx = this._getOrReturnCtx(input, ctx);
            addIssueToContext(ctx, {
              code: ZodIssueCode.invalid_string,
              validation: "time",
              message: check.message
            });
            status.dirty();
          }
        } else if (check.kind === "duration") {
          if (!durationRegex.test(input.data)) {
            ctx = this._getOrReturnCtx(input, ctx);
            addIssueToContext(ctx, {
              validation: "duration",
              code: ZodIssueCode.invalid_string,
              message: check.message
            });
            status.dirty();
          }
        } else if (check.kind === "ip") {
          if (!isValidIP(input.data, check.version)) {
            ctx = this._getOrReturnCtx(input, ctx);
            addIssueToContext(ctx, {
              validation: "ip",
              code: ZodIssueCode.invalid_string,
              message: check.message
            });
            status.dirty();
          }
        } else if (check.kind === "jwt") {
          if (!isValidJWT(input.data, check.alg)) {
            ctx = this._getOrReturnCtx(input, ctx);
            addIssueToContext(ctx, {
              validation: "jwt",
              code: ZodIssueCode.invalid_string,
              message: check.message
            });
            status.dirty();
          }
        } else if (check.kind === "cidr") {
          if (!isValidCidr(input.data, check.version)) {
            ctx = this._getOrReturnCtx(input, ctx);
            addIssueToContext(ctx, {
              validation: "cidr",
              code: ZodIssueCode.invalid_string,
              message: check.message
            });
            status.dirty();
          }
        } else if (check.kind === "base64") {
          if (!base64Regex.test(input.data)) {
            ctx = this._getOrReturnCtx(input, ctx);
            addIssueToContext(ctx, {
              validation: "base64",
              code: ZodIssueCode.invalid_string,
              message: check.message
            });
            status.dirty();
          }
        } else if (check.kind === "base64url") {
          if (!base64urlRegex.test(input.data)) {
            ctx = this._getOrReturnCtx(input, ctx);
            addIssueToContext(ctx, {
              validation: "base64url",
              code: ZodIssueCode.invalid_string,
              message: check.message
            });
            status.dirty();
          }
        } else {
          util.assertNever(check);
        }
      }
      return { status: status.value, value: input.data };
    }
    _regex(regex, validation, message) {
      return this.refinement((data) => regex.test(data), {
        validation,
        code: ZodIssueCode.invalid_string,
        ...errorUtil.errToObj(message)
      });
    }
    _addCheck(check) {
      return new ZodString({
        ...this._def,
        checks: [...this._def.checks, check]
      });
    }
    email(message) {
      return this._addCheck({ kind: "email", ...errorUtil.errToObj(message) });
    }
    url(message) {
      return this._addCheck({ kind: "url", ...errorUtil.errToObj(message) });
    }
    emoji(message) {
      return this._addCheck({ kind: "emoji", ...errorUtil.errToObj(message) });
    }
    uuid(message) {
      return this._addCheck({ kind: "uuid", ...errorUtil.errToObj(message) });
    }
    nanoid(message) {
      return this._addCheck({ kind: "nanoid", ...errorUtil.errToObj(message) });
    }
    cuid(message) {
      return this._addCheck({ kind: "cuid", ...errorUtil.errToObj(message) });
    }
    cuid2(message) {
      return this._addCheck({ kind: "cuid2", ...errorUtil.errToObj(message) });
    }
    ulid(message) {
      return this._addCheck({ kind: "ulid", ...errorUtil.errToObj(message) });
    }
    base64(message) {
      return this._addCheck({ kind: "base64", ...errorUtil.errToObj(message) });
    }
    base64url(message) {
      return this._addCheck({
        kind: "base64url",
        ...errorUtil.errToObj(message)
      });
    }
    jwt(options) {
      return this._addCheck({ kind: "jwt", ...errorUtil.errToObj(options) });
    }
    ip(options) {
      return this._addCheck({ kind: "ip", ...errorUtil.errToObj(options) });
    }
    cidr(options) {
      return this._addCheck({ kind: "cidr", ...errorUtil.errToObj(options) });
    }
    datetime(options) {
      if (typeof options === "string") {
        return this._addCheck({
          kind: "datetime",
          precision: null,
          offset: false,
          local: false,
          message: options
        });
      }
      return this._addCheck({
        kind: "datetime",
        precision: typeof options?.precision === "undefined" ? null : options?.precision,
        offset: options?.offset ?? false,
        local: options?.local ?? false,
        ...errorUtil.errToObj(options?.message)
      });
    }
    date(message) {
      return this._addCheck({ kind: "date", message });
    }
    time(options) {
      if (typeof options === "string") {
        return this._addCheck({
          kind: "time",
          precision: null,
          message: options
        });
      }
      return this._addCheck({
        kind: "time",
        precision: typeof options?.precision === "undefined" ? null : options?.precision,
        ...errorUtil.errToObj(options?.message)
      });
    }
    duration(message) {
      return this._addCheck({ kind: "duration", ...errorUtil.errToObj(message) });
    }
    regex(regex, message) {
      return this._addCheck({
        kind: "regex",
        regex,
        ...errorUtil.errToObj(message)
      });
    }
    includes(value, options) {
      return this._addCheck({
        kind: "includes",
        value,
        position: options?.position,
        ...errorUtil.errToObj(options?.message)
      });
    }
    startsWith(value, message) {
      return this._addCheck({
        kind: "startsWith",
        value,
        ...errorUtil.errToObj(message)
      });
    }
    endsWith(value, message) {
      return this._addCheck({
        kind: "endsWith",
        value,
        ...errorUtil.errToObj(message)
      });
    }
    min(minLength, message) {
      return this._addCheck({
        kind: "min",
        value: minLength,
        ...errorUtil.errToObj(message)
      });
    }
    max(maxLength, message) {
      return this._addCheck({
        kind: "max",
        value: maxLength,
        ...errorUtil.errToObj(message)
      });
    }
    length(len, message) {
      return this._addCheck({
        kind: "length",
        value: len,
        ...errorUtil.errToObj(message)
      });
    }
    nonempty(message) {
      return this.min(1, errorUtil.errToObj(message));
    }
    trim() {
      return new ZodString({
        ...this._def,
        checks: [...this._def.checks, { kind: "trim" }]
      });
    }
    toLowerCase() {
      return new ZodString({
        ...this._def,
        checks: [...this._def.checks, { kind: "toLowerCase" }]
      });
    }
    toUpperCase() {
      return new ZodString({
        ...this._def,
        checks: [...this._def.checks, { kind: "toUpperCase" }]
      });
    }
    get isDatetime() {
      return !!this._def.checks.find((ch) => ch.kind === "datetime");
    }
    get isDate() {
      return !!this._def.checks.find((ch) => ch.kind === "date");
    }
    get isTime() {
      return !!this._def.checks.find((ch) => ch.kind === "time");
    }
    get isDuration() {
      return !!this._def.checks.find((ch) => ch.kind === "duration");
    }
    get isEmail() {
      return !!this._def.checks.find((ch) => ch.kind === "email");
    }
    get isURL() {
      return !!this._def.checks.find((ch) => ch.kind === "url");
    }
    get isEmoji() {
      return !!this._def.checks.find((ch) => ch.kind === "emoji");
    }
    get isUUID() {
      return !!this._def.checks.find((ch) => ch.kind === "uuid");
    }
    get isNANOID() {
      return !!this._def.checks.find((ch) => ch.kind === "nanoid");
    }
    get isCUID() {
      return !!this._def.checks.find((ch) => ch.kind === "cuid");
    }
    get isCUID2() {
      return !!this._def.checks.find((ch) => ch.kind === "cuid2");
    }
    get isULID() {
      return !!this._def.checks.find((ch) => ch.kind === "ulid");
    }
    get isIP() {
      return !!this._def.checks.find((ch) => ch.kind === "ip");
    }
    get isCIDR() {
      return !!this._def.checks.find((ch) => ch.kind === "cidr");
    }
    get isBase64() {
      return !!this._def.checks.find((ch) => ch.kind === "base64");
    }
    get isBase64url() {
      return !!this._def.checks.find((ch) => ch.kind === "base64url");
    }
    get minLength() {
      let min = null;
      for (const ch of this._def.checks) {
        if (ch.kind === "min") {
          if (min === null || ch.value > min)
            min = ch.value;
        }
      }
      return min;
    }
    get maxLength() {
      let max = null;
      for (const ch of this._def.checks) {
        if (ch.kind === "max") {
          if (max === null || ch.value < max)
            max = ch.value;
        }
      }
      return max;
    }
  };
  ZodString.create = (params) => {
    return new ZodString({
      checks: [],
      typeName: ZodFirstPartyTypeKind.ZodString,
      coerce: params?.coerce ?? false,
      ...processCreateParams(params)
    });
  };
  ZodNumber = class ZodNumber extends ZodType {
    constructor() {
      super(...arguments);
      this.min = this.gte;
      this.max = this.lte;
      this.step = this.multipleOf;
    }
    _parse(input) {
      if (this._def.coerce) {
        input.data = Number(input.data);
      }
      const parsedType = this._getType(input);
      if (parsedType !== ZodParsedType.number) {
        const ctx = this._getOrReturnCtx(input);
        addIssueToContext(ctx, {
          code: ZodIssueCode.invalid_type,
          expected: ZodParsedType.number,
          received: ctx.parsedType
        });
        return INVALID;
      }
      let ctx = undefined;
      const status = new ParseStatus;
      for (const check of this._def.checks) {
        if (check.kind === "int") {
          if (!util.isInteger(input.data)) {
            ctx = this._getOrReturnCtx(input, ctx);
            addIssueToContext(ctx, {
              code: ZodIssueCode.invalid_type,
              expected: "integer",
              received: "float",
              message: check.message
            });
            status.dirty();
          }
        } else if (check.kind === "min") {
          const tooSmall = check.inclusive ? input.data < check.value : input.data <= check.value;
          if (tooSmall) {
            ctx = this._getOrReturnCtx(input, ctx);
            addIssueToContext(ctx, {
              code: ZodIssueCode.too_small,
              minimum: check.value,
              type: "number",
              inclusive: check.inclusive,
              exact: false,
              message: check.message
            });
            status.dirty();
          }
        } else if (check.kind === "max") {
          const tooBig = check.inclusive ? input.data > check.value : input.data >= check.value;
          if (tooBig) {
            ctx = this._getOrReturnCtx(input, ctx);
            addIssueToContext(ctx, {
              code: ZodIssueCode.too_big,
              maximum: check.value,
              type: "number",
              inclusive: check.inclusive,
              exact: false,
              message: check.message
            });
            status.dirty();
          }
        } else if (check.kind === "multipleOf") {
          if (floatSafeRemainder(input.data, check.value) !== 0) {
            ctx = this._getOrReturnCtx(input, ctx);
            addIssueToContext(ctx, {
              code: ZodIssueCode.not_multiple_of,
              multipleOf: check.value,
              message: check.message
            });
            status.dirty();
          }
        } else if (check.kind === "finite") {
          if (!Number.isFinite(input.data)) {
            ctx = this._getOrReturnCtx(input, ctx);
            addIssueToContext(ctx, {
              code: ZodIssueCode.not_finite,
              message: check.message
            });
            status.dirty();
          }
        } else {
          util.assertNever(check);
        }
      }
      return { status: status.value, value: input.data };
    }
    gte(value, message) {
      return this.setLimit("min", value, true, errorUtil.toString(message));
    }
    gt(value, message) {
      return this.setLimit("min", value, false, errorUtil.toString(message));
    }
    lte(value, message) {
      return this.setLimit("max", value, true, errorUtil.toString(message));
    }
    lt(value, message) {
      return this.setLimit("max", value, false, errorUtil.toString(message));
    }
    setLimit(kind, value, inclusive, message) {
      return new ZodNumber({
        ...this._def,
        checks: [
          ...this._def.checks,
          {
            kind,
            value,
            inclusive,
            message: errorUtil.toString(message)
          }
        ]
      });
    }
    _addCheck(check) {
      return new ZodNumber({
        ...this._def,
        checks: [...this._def.checks, check]
      });
    }
    int(message) {
      return this._addCheck({
        kind: "int",
        message: errorUtil.toString(message)
      });
    }
    positive(message) {
      return this._addCheck({
        kind: "min",
        value: 0,
        inclusive: false,
        message: errorUtil.toString(message)
      });
    }
    negative(message) {
      return this._addCheck({
        kind: "max",
        value: 0,
        inclusive: false,
        message: errorUtil.toString(message)
      });
    }
    nonpositive(message) {
      return this._addCheck({
        kind: "max",
        value: 0,
        inclusive: true,
        message: errorUtil.toString(message)
      });
    }
    nonnegative(message) {
      return this._addCheck({
        kind: "min",
        value: 0,
        inclusive: true,
        message: errorUtil.toString(message)
      });
    }
    multipleOf(value, message) {
      return this._addCheck({
        kind: "multipleOf",
        value,
        message: errorUtil.toString(message)
      });
    }
    finite(message) {
      return this._addCheck({
        kind: "finite",
        message: errorUtil.toString(message)
      });
    }
    safe(message) {
      return this._addCheck({
        kind: "min",
        inclusive: true,
        value: Number.MIN_SAFE_INTEGER,
        message: errorUtil.toString(message)
      })._addCheck({
        kind: "max",
        inclusive: true,
        value: Number.MAX_SAFE_INTEGER,
        message: errorUtil.toString(message)
      });
    }
    get minValue() {
      let min = null;
      for (const ch of this._def.checks) {
        if (ch.kind === "min") {
          if (min === null || ch.value > min)
            min = ch.value;
        }
      }
      return min;
    }
    get maxValue() {
      let max = null;
      for (const ch of this._def.checks) {
        if (ch.kind === "max") {
          if (max === null || ch.value < max)
            max = ch.value;
        }
      }
      return max;
    }
    get isInt() {
      return !!this._def.checks.find((ch) => ch.kind === "int" || ch.kind === "multipleOf" && util.isInteger(ch.value));
    }
    get isFinite() {
      let max = null;
      let min = null;
      for (const ch of this._def.checks) {
        if (ch.kind === "finite" || ch.kind === "int" || ch.kind === "multipleOf") {
          return true;
        } else if (ch.kind === "min") {
          if (min === null || ch.value > min)
            min = ch.value;
        } else if (ch.kind === "max") {
          if (max === null || ch.value < max)
            max = ch.value;
        }
      }
      return Number.isFinite(min) && Number.isFinite(max);
    }
  };
  ZodNumber.create = (params) => {
    return new ZodNumber({
      checks: [],
      typeName: ZodFirstPartyTypeKind.ZodNumber,
      coerce: params?.coerce || false,
      ...processCreateParams(params)
    });
  };
  ZodBigInt = class ZodBigInt extends ZodType {
    constructor() {
      super(...arguments);
      this.min = this.gte;
      this.max = this.lte;
    }
    _parse(input) {
      if (this._def.coerce) {
        try {
          input.data = BigInt(input.data);
        } catch {
          return this._getInvalidInput(input);
        }
      }
      const parsedType = this._getType(input);
      if (parsedType !== ZodParsedType.bigint) {
        return this._getInvalidInput(input);
      }
      let ctx = undefined;
      const status = new ParseStatus;
      for (const check of this._def.checks) {
        if (check.kind === "min") {
          const tooSmall = check.inclusive ? input.data < check.value : input.data <= check.value;
          if (tooSmall) {
            ctx = this._getOrReturnCtx(input, ctx);
            addIssueToContext(ctx, {
              code: ZodIssueCode.too_small,
              type: "bigint",
              minimum: check.value,
              inclusive: check.inclusive,
              message: check.message
            });
            status.dirty();
          }
        } else if (check.kind === "max") {
          const tooBig = check.inclusive ? input.data > check.value : input.data >= check.value;
          if (tooBig) {
            ctx = this._getOrReturnCtx(input, ctx);
            addIssueToContext(ctx, {
              code: ZodIssueCode.too_big,
              type: "bigint",
              maximum: check.value,
              inclusive: check.inclusive,
              message: check.message
            });
            status.dirty();
          }
        } else if (check.kind === "multipleOf") {
          if (input.data % check.value !== BigInt(0)) {
            ctx = this._getOrReturnCtx(input, ctx);
            addIssueToContext(ctx, {
              code: ZodIssueCode.not_multiple_of,
              multipleOf: check.value,
              message: check.message
            });
            status.dirty();
          }
        } else {
          util.assertNever(check);
        }
      }
      return { status: status.value, value: input.data };
    }
    _getInvalidInput(input) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.bigint,
        received: ctx.parsedType
      });
      return INVALID;
    }
    gte(value, message) {
      return this.setLimit("min", value, true, errorUtil.toString(message));
    }
    gt(value, message) {
      return this.setLimit("min", value, false, errorUtil.toString(message));
    }
    lte(value, message) {
      return this.setLimit("max", value, true, errorUtil.toString(message));
    }
    lt(value, message) {
      return this.setLimit("max", value, false, errorUtil.toString(message));
    }
    setLimit(kind, value, inclusive, message) {
      return new ZodBigInt({
        ...this._def,
        checks: [
          ...this._def.checks,
          {
            kind,
            value,
            inclusive,
            message: errorUtil.toString(message)
          }
        ]
      });
    }
    _addCheck(check) {
      return new ZodBigInt({
        ...this._def,
        checks: [...this._def.checks, check]
      });
    }
    positive(message) {
      return this._addCheck({
        kind: "min",
        value: BigInt(0),
        inclusive: false,
        message: errorUtil.toString(message)
      });
    }
    negative(message) {
      return this._addCheck({
        kind: "max",
        value: BigInt(0),
        inclusive: false,
        message: errorUtil.toString(message)
      });
    }
    nonpositive(message) {
      return this._addCheck({
        kind: "max",
        value: BigInt(0),
        inclusive: true,
        message: errorUtil.toString(message)
      });
    }
    nonnegative(message) {
      return this._addCheck({
        kind: "min",
        value: BigInt(0),
        inclusive: true,
        message: errorUtil.toString(message)
      });
    }
    multipleOf(value, message) {
      return this._addCheck({
        kind: "multipleOf",
        value,
        message: errorUtil.toString(message)
      });
    }
    get minValue() {
      let min = null;
      for (const ch of this._def.checks) {
        if (ch.kind === "min") {
          if (min === null || ch.value > min)
            min = ch.value;
        }
      }
      return min;
    }
    get maxValue() {
      let max = null;
      for (const ch of this._def.checks) {
        if (ch.kind === "max") {
          if (max === null || ch.value < max)
            max = ch.value;
        }
      }
      return max;
    }
  };
  ZodBigInt.create = (params) => {
    return new ZodBigInt({
      checks: [],
      typeName: ZodFirstPartyTypeKind.ZodBigInt,
      coerce: params?.coerce ?? false,
      ...processCreateParams(params)
    });
  };
  ZodBoolean = class ZodBoolean extends ZodType {
    _parse(input) {
      if (this._def.coerce) {
        input.data = Boolean(input.data);
      }
      const parsedType = this._getType(input);
      if (parsedType !== ZodParsedType.boolean) {
        const ctx = this._getOrReturnCtx(input);
        addIssueToContext(ctx, {
          code: ZodIssueCode.invalid_type,
          expected: ZodParsedType.boolean,
          received: ctx.parsedType
        });
        return INVALID;
      }
      return OK(input.data);
    }
  };
  ZodBoolean.create = (params) => {
    return new ZodBoolean({
      typeName: ZodFirstPartyTypeKind.ZodBoolean,
      coerce: params?.coerce || false,
      ...processCreateParams(params)
    });
  };
  ZodDate = class ZodDate extends ZodType {
    _parse(input) {
      if (this._def.coerce) {
        input.data = new Date(input.data);
      }
      const parsedType = this._getType(input);
      if (parsedType !== ZodParsedType.date) {
        const ctx = this._getOrReturnCtx(input);
        addIssueToContext(ctx, {
          code: ZodIssueCode.invalid_type,
          expected: ZodParsedType.date,
          received: ctx.parsedType
        });
        return INVALID;
      }
      if (Number.isNaN(input.data.getTime())) {
        const ctx = this._getOrReturnCtx(input);
        addIssueToContext(ctx, {
          code: ZodIssueCode.invalid_date
        });
        return INVALID;
      }
      const status = new ParseStatus;
      let ctx = undefined;
      for (const check of this._def.checks) {
        if (check.kind === "min") {
          if (input.data.getTime() < check.value) {
            ctx = this._getOrReturnCtx(input, ctx);
            addIssueToContext(ctx, {
              code: ZodIssueCode.too_small,
              message: check.message,
              inclusive: true,
              exact: false,
              minimum: check.value,
              type: "date"
            });
            status.dirty();
          }
        } else if (check.kind === "max") {
          if (input.data.getTime() > check.value) {
            ctx = this._getOrReturnCtx(input, ctx);
            addIssueToContext(ctx, {
              code: ZodIssueCode.too_big,
              message: check.message,
              inclusive: true,
              exact: false,
              maximum: check.value,
              type: "date"
            });
            status.dirty();
          }
        } else {
          util.assertNever(check);
        }
      }
      return {
        status: status.value,
        value: new Date(input.data.getTime())
      };
    }
    _addCheck(check) {
      return new ZodDate({
        ...this._def,
        checks: [...this._def.checks, check]
      });
    }
    min(minDate, message) {
      return this._addCheck({
        kind: "min",
        value: minDate.getTime(),
        message: errorUtil.toString(message)
      });
    }
    max(maxDate, message) {
      return this._addCheck({
        kind: "max",
        value: maxDate.getTime(),
        message: errorUtil.toString(message)
      });
    }
    get minDate() {
      let min = null;
      for (const ch of this._def.checks) {
        if (ch.kind === "min") {
          if (min === null || ch.value > min)
            min = ch.value;
        }
      }
      return min != null ? new Date(min) : null;
    }
    get maxDate() {
      let max = null;
      for (const ch of this._def.checks) {
        if (ch.kind === "max") {
          if (max === null || ch.value < max)
            max = ch.value;
        }
      }
      return max != null ? new Date(max) : null;
    }
  };
  ZodDate.create = (params) => {
    return new ZodDate({
      checks: [],
      coerce: params?.coerce || false,
      typeName: ZodFirstPartyTypeKind.ZodDate,
      ...processCreateParams(params)
    });
  };
  ZodSymbol = class ZodSymbol extends ZodType {
    _parse(input) {
      const parsedType = this._getType(input);
      if (parsedType !== ZodParsedType.symbol) {
        const ctx = this._getOrReturnCtx(input);
        addIssueToContext(ctx, {
          code: ZodIssueCode.invalid_type,
          expected: ZodParsedType.symbol,
          received: ctx.parsedType
        });
        return INVALID;
      }
      return OK(input.data);
    }
  };
  ZodSymbol.create = (params) => {
    return new ZodSymbol({
      typeName: ZodFirstPartyTypeKind.ZodSymbol,
      ...processCreateParams(params)
    });
  };
  ZodUndefined = class ZodUndefined extends ZodType {
    _parse(input) {
      const parsedType = this._getType(input);
      if (parsedType !== ZodParsedType.undefined) {
        const ctx = this._getOrReturnCtx(input);
        addIssueToContext(ctx, {
          code: ZodIssueCode.invalid_type,
          expected: ZodParsedType.undefined,
          received: ctx.parsedType
        });
        return INVALID;
      }
      return OK(input.data);
    }
  };
  ZodUndefined.create = (params) => {
    return new ZodUndefined({
      typeName: ZodFirstPartyTypeKind.ZodUndefined,
      ...processCreateParams(params)
    });
  };
  ZodNull = class ZodNull extends ZodType {
    _parse(input) {
      const parsedType = this._getType(input);
      if (parsedType !== ZodParsedType.null) {
        const ctx = this._getOrReturnCtx(input);
        addIssueToContext(ctx, {
          code: ZodIssueCode.invalid_type,
          expected: ZodParsedType.null,
          received: ctx.parsedType
        });
        return INVALID;
      }
      return OK(input.data);
    }
  };
  ZodNull.create = (params) => {
    return new ZodNull({
      typeName: ZodFirstPartyTypeKind.ZodNull,
      ...processCreateParams(params)
    });
  };
  ZodAny = class ZodAny extends ZodType {
    constructor() {
      super(...arguments);
      this._any = true;
    }
    _parse(input) {
      return OK(input.data);
    }
  };
  ZodAny.create = (params) => {
    return new ZodAny({
      typeName: ZodFirstPartyTypeKind.ZodAny,
      ...processCreateParams(params)
    });
  };
  ZodUnknown = class ZodUnknown extends ZodType {
    constructor() {
      super(...arguments);
      this._unknown = true;
    }
    _parse(input) {
      return OK(input.data);
    }
  };
  ZodUnknown.create = (params) => {
    return new ZodUnknown({
      typeName: ZodFirstPartyTypeKind.ZodUnknown,
      ...processCreateParams(params)
    });
  };
  ZodNever = class ZodNever extends ZodType {
    _parse(input) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.never,
        received: ctx.parsedType
      });
      return INVALID;
    }
  };
  ZodNever.create = (params) => {
    return new ZodNever({
      typeName: ZodFirstPartyTypeKind.ZodNever,
      ...processCreateParams(params)
    });
  };
  ZodVoid = class ZodVoid extends ZodType {
    _parse(input) {
      const parsedType = this._getType(input);
      if (parsedType !== ZodParsedType.undefined) {
        const ctx = this._getOrReturnCtx(input);
        addIssueToContext(ctx, {
          code: ZodIssueCode.invalid_type,
          expected: ZodParsedType.void,
          received: ctx.parsedType
        });
        return INVALID;
      }
      return OK(input.data);
    }
  };
  ZodVoid.create = (params) => {
    return new ZodVoid({
      typeName: ZodFirstPartyTypeKind.ZodVoid,
      ...processCreateParams(params)
    });
  };
  ZodArray = class ZodArray extends ZodType {
    _parse(input) {
      const { ctx, status } = this._processInputParams(input);
      const def = this._def;
      if (ctx.parsedType !== ZodParsedType.array) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.invalid_type,
          expected: ZodParsedType.array,
          received: ctx.parsedType
        });
        return INVALID;
      }
      if (def.exactLength !== null) {
        const tooBig = ctx.data.length > def.exactLength.value;
        const tooSmall = ctx.data.length < def.exactLength.value;
        if (tooBig || tooSmall) {
          addIssueToContext(ctx, {
            code: tooBig ? ZodIssueCode.too_big : ZodIssueCode.too_small,
            minimum: tooSmall ? def.exactLength.value : undefined,
            maximum: tooBig ? def.exactLength.value : undefined,
            type: "array",
            inclusive: true,
            exact: true,
            message: def.exactLength.message
          });
          status.dirty();
        }
      }
      if (def.minLength !== null) {
        if (ctx.data.length < def.minLength.value) {
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_small,
            minimum: def.minLength.value,
            type: "array",
            inclusive: true,
            exact: false,
            message: def.minLength.message
          });
          status.dirty();
        }
      }
      if (def.maxLength !== null) {
        if (ctx.data.length > def.maxLength.value) {
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_big,
            maximum: def.maxLength.value,
            type: "array",
            inclusive: true,
            exact: false,
            message: def.maxLength.message
          });
          status.dirty();
        }
      }
      if (ctx.common.async) {
        return Promise.all([...ctx.data].map((item, i) => {
          return def.type._parseAsync(new ParseInputLazyPath(ctx, item, ctx.path, i));
        })).then((result) => {
          return ParseStatus.mergeArray(status, result);
        });
      }
      const result = [...ctx.data].map((item, i) => {
        return def.type._parseSync(new ParseInputLazyPath(ctx, item, ctx.path, i));
      });
      return ParseStatus.mergeArray(status, result);
    }
    get element() {
      return this._def.type;
    }
    min(minLength, message) {
      return new ZodArray({
        ...this._def,
        minLength: { value: minLength, message: errorUtil.toString(message) }
      });
    }
    max(maxLength, message) {
      return new ZodArray({
        ...this._def,
        maxLength: { value: maxLength, message: errorUtil.toString(message) }
      });
    }
    length(len, message) {
      return new ZodArray({
        ...this._def,
        exactLength: { value: len, message: errorUtil.toString(message) }
      });
    }
    nonempty(message) {
      return this.min(1, message);
    }
  };
  ZodArray.create = (schema, params) => {
    return new ZodArray({
      type: schema,
      minLength: null,
      maxLength: null,
      exactLength: null,
      typeName: ZodFirstPartyTypeKind.ZodArray,
      ...processCreateParams(params)
    });
  };
  ZodObject = class ZodObject extends ZodType {
    constructor() {
      super(...arguments);
      this._cached = null;
      this.nonstrict = this.passthrough;
      this.augment = this.extend;
    }
    _getCached() {
      if (this._cached !== null)
        return this._cached;
      const shape = this._def.shape();
      const keys = util.objectKeys(shape);
      this._cached = { shape, keys };
      return this._cached;
    }
    _parse(input) {
      const parsedType = this._getType(input);
      if (parsedType !== ZodParsedType.object) {
        const ctx = this._getOrReturnCtx(input);
        addIssueToContext(ctx, {
          code: ZodIssueCode.invalid_type,
          expected: ZodParsedType.object,
          received: ctx.parsedType
        });
        return INVALID;
      }
      const { status, ctx } = this._processInputParams(input);
      const { shape, keys: shapeKeys } = this._getCached();
      const extraKeys = [];
      if (!(this._def.catchall instanceof ZodNever && this._def.unknownKeys === "strip")) {
        for (const key in ctx.data) {
          if (!shapeKeys.includes(key)) {
            extraKeys.push(key);
          }
        }
      }
      const pairs = [];
      for (const key of shapeKeys) {
        const keyValidator = shape[key];
        const value = ctx.data[key];
        pairs.push({
          key: { status: "valid", value: key },
          value: keyValidator._parse(new ParseInputLazyPath(ctx, value, ctx.path, key)),
          alwaysSet: key in ctx.data
        });
      }
      if (this._def.catchall instanceof ZodNever) {
        const unknownKeys = this._def.unknownKeys;
        if (unknownKeys === "passthrough") {
          for (const key of extraKeys) {
            pairs.push({
              key: { status: "valid", value: key },
              value: { status: "valid", value: ctx.data[key] }
            });
          }
        } else if (unknownKeys === "strict") {
          if (extraKeys.length > 0) {
            addIssueToContext(ctx, {
              code: ZodIssueCode.unrecognized_keys,
              keys: extraKeys
            });
            status.dirty();
          }
        } else if (unknownKeys === "strip") {} else {
          throw new Error(`Internal ZodObject error: invalid unknownKeys value.`);
        }
      } else {
        const catchall = this._def.catchall;
        for (const key of extraKeys) {
          const value = ctx.data[key];
          pairs.push({
            key: { status: "valid", value: key },
            value: catchall._parse(new ParseInputLazyPath(ctx, value, ctx.path, key)),
            alwaysSet: key in ctx.data
          });
        }
      }
      if (ctx.common.async) {
        return Promise.resolve().then(async () => {
          const syncPairs = [];
          for (const pair of pairs) {
            const key = await pair.key;
            const value = await pair.value;
            syncPairs.push({
              key,
              value,
              alwaysSet: pair.alwaysSet
            });
          }
          return syncPairs;
        }).then((syncPairs) => {
          return ParseStatus.mergeObjectSync(status, syncPairs);
        });
      } else {
        return ParseStatus.mergeObjectSync(status, pairs);
      }
    }
    get shape() {
      return this._def.shape();
    }
    strict(message) {
      errorUtil.errToObj;
      return new ZodObject({
        ...this._def,
        unknownKeys: "strict",
        ...message !== undefined ? {
          errorMap: (issue, ctx) => {
            const defaultError = this._def.errorMap?.(issue, ctx).message ?? ctx.defaultError;
            if (issue.code === "unrecognized_keys")
              return {
                message: errorUtil.errToObj(message).message ?? defaultError
              };
            return {
              message: defaultError
            };
          }
        } : {}
      });
    }
    strip() {
      return new ZodObject({
        ...this._def,
        unknownKeys: "strip"
      });
    }
    passthrough() {
      return new ZodObject({
        ...this._def,
        unknownKeys: "passthrough"
      });
    }
    extend(augmentation) {
      return new ZodObject({
        ...this._def,
        shape: () => ({
          ...this._def.shape(),
          ...augmentation
        })
      });
    }
    merge(merging) {
      const merged = new ZodObject({
        unknownKeys: merging._def.unknownKeys,
        catchall: merging._def.catchall,
        shape: () => ({
          ...this._def.shape(),
          ...merging._def.shape()
        }),
        typeName: ZodFirstPartyTypeKind.ZodObject
      });
      return merged;
    }
    setKey(key, schema) {
      return this.augment({ [key]: schema });
    }
    catchall(index) {
      return new ZodObject({
        ...this._def,
        catchall: index
      });
    }
    pick(mask) {
      const shape = {};
      for (const key of util.objectKeys(mask)) {
        if (mask[key] && this.shape[key]) {
          shape[key] = this.shape[key];
        }
      }
      return new ZodObject({
        ...this._def,
        shape: () => shape
      });
    }
    omit(mask) {
      const shape = {};
      for (const key of util.objectKeys(this.shape)) {
        if (!mask[key]) {
          shape[key] = this.shape[key];
        }
      }
      return new ZodObject({
        ...this._def,
        shape: () => shape
      });
    }
    deepPartial() {
      return deepPartialify(this);
    }
    partial(mask) {
      const newShape = {};
      for (const key of util.objectKeys(this.shape)) {
        const fieldSchema = this.shape[key];
        if (mask && !mask[key]) {
          newShape[key] = fieldSchema;
        } else {
          newShape[key] = fieldSchema.optional();
        }
      }
      return new ZodObject({
        ...this._def,
        shape: () => newShape
      });
    }
    required(mask) {
      const newShape = {};
      for (const key of util.objectKeys(this.shape)) {
        if (mask && !mask[key]) {
          newShape[key] = this.shape[key];
        } else {
          const fieldSchema = this.shape[key];
          let newField = fieldSchema;
          while (newField instanceof ZodOptional) {
            newField = newField._def.innerType;
          }
          newShape[key] = newField;
        }
      }
      return new ZodObject({
        ...this._def,
        shape: () => newShape
      });
    }
    keyof() {
      return createZodEnum(util.objectKeys(this.shape));
    }
  };
  ZodObject.create = (shape, params) => {
    return new ZodObject({
      shape: () => shape,
      unknownKeys: "strip",
      catchall: ZodNever.create(),
      typeName: ZodFirstPartyTypeKind.ZodObject,
      ...processCreateParams(params)
    });
  };
  ZodObject.strictCreate = (shape, params) => {
    return new ZodObject({
      shape: () => shape,
      unknownKeys: "strict",
      catchall: ZodNever.create(),
      typeName: ZodFirstPartyTypeKind.ZodObject,
      ...processCreateParams(params)
    });
  };
  ZodObject.lazycreate = (shape, params) => {
    return new ZodObject({
      shape,
      unknownKeys: "strip",
      catchall: ZodNever.create(),
      typeName: ZodFirstPartyTypeKind.ZodObject,
      ...processCreateParams(params)
    });
  };
  ZodUnion = class ZodUnion extends ZodType {
    _parse(input) {
      const { ctx } = this._processInputParams(input);
      const options = this._def.options;
      function handleResults(results) {
        for (const result of results) {
          if (result.result.status === "valid") {
            return result.result;
          }
        }
        for (const result of results) {
          if (result.result.status === "dirty") {
            ctx.common.issues.push(...result.ctx.common.issues);
            return result.result;
          }
        }
        const unionErrors = results.map((result) => new ZodError(result.ctx.common.issues));
        addIssueToContext(ctx, {
          code: ZodIssueCode.invalid_union,
          unionErrors
        });
        return INVALID;
      }
      if (ctx.common.async) {
        return Promise.all(options.map(async (option) => {
          const childCtx = {
            ...ctx,
            common: {
              ...ctx.common,
              issues: []
            },
            parent: null
          };
          return {
            result: await option._parseAsync({
              data: ctx.data,
              path: ctx.path,
              parent: childCtx
            }),
            ctx: childCtx
          };
        })).then(handleResults);
      } else {
        let dirty = undefined;
        const issues = [];
        for (const option of options) {
          const childCtx = {
            ...ctx,
            common: {
              ...ctx.common,
              issues: []
            },
            parent: null
          };
          const result = option._parseSync({
            data: ctx.data,
            path: ctx.path,
            parent: childCtx
          });
          if (result.status === "valid") {
            return result;
          } else if (result.status === "dirty" && !dirty) {
            dirty = { result, ctx: childCtx };
          }
          if (childCtx.common.issues.length) {
            issues.push(childCtx.common.issues);
          }
        }
        if (dirty) {
          ctx.common.issues.push(...dirty.ctx.common.issues);
          return dirty.result;
        }
        const unionErrors = issues.map((issues) => new ZodError(issues));
        addIssueToContext(ctx, {
          code: ZodIssueCode.invalid_union,
          unionErrors
        });
        return INVALID;
      }
    }
    get options() {
      return this._def.options;
    }
  };
  ZodUnion.create = (types, params) => {
    return new ZodUnion({
      options: types,
      typeName: ZodFirstPartyTypeKind.ZodUnion,
      ...processCreateParams(params)
    });
  };
  ZodDiscriminatedUnion = class ZodDiscriminatedUnion extends ZodType {
    _parse(input) {
      const { ctx } = this._processInputParams(input);
      if (ctx.parsedType !== ZodParsedType.object) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.invalid_type,
          expected: ZodParsedType.object,
          received: ctx.parsedType
        });
        return INVALID;
      }
      const discriminator = this.discriminator;
      const discriminatorValue = ctx.data[discriminator];
      const option = this.optionsMap.get(discriminatorValue);
      if (!option) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.invalid_union_discriminator,
          options: Array.from(this.optionsMap.keys()),
          path: [discriminator]
        });
        return INVALID;
      }
      if (ctx.common.async) {
        return option._parseAsync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx
        });
      } else {
        return option._parseSync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx
        });
      }
    }
    get discriminator() {
      return this._def.discriminator;
    }
    get options() {
      return this._def.options;
    }
    get optionsMap() {
      return this._def.optionsMap;
    }
    static create(discriminator, options, params) {
      const optionsMap = new Map;
      for (const type of options) {
        const discriminatorValues = getDiscriminator(type.shape[discriminator]);
        if (!discriminatorValues.length) {
          throw new Error(`A discriminator value for key \`${discriminator}\` could not be extracted from all schema options`);
        }
        for (const value of discriminatorValues) {
          if (optionsMap.has(value)) {
            throw new Error(`Discriminator property ${String(discriminator)} has duplicate value ${String(value)}`);
          }
          optionsMap.set(value, type);
        }
      }
      return new ZodDiscriminatedUnion({
        typeName: ZodFirstPartyTypeKind.ZodDiscriminatedUnion,
        discriminator,
        options,
        optionsMap,
        ...processCreateParams(params)
      });
    }
  };
  ZodIntersection = class ZodIntersection extends ZodType {
    _parse(input) {
      const { status, ctx } = this._processInputParams(input);
      const handleParsed = (parsedLeft, parsedRight) => {
        if (isAborted(parsedLeft) || isAborted(parsedRight)) {
          return INVALID;
        }
        const merged = mergeValues(parsedLeft.value, parsedRight.value);
        if (!merged.valid) {
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_intersection_types
          });
          return INVALID;
        }
        if (isDirty(parsedLeft) || isDirty(parsedRight)) {
          status.dirty();
        }
        return { status: status.value, value: merged.data };
      };
      if (ctx.common.async) {
        return Promise.all([
          this._def.left._parseAsync({
            data: ctx.data,
            path: ctx.path,
            parent: ctx
          }),
          this._def.right._parseAsync({
            data: ctx.data,
            path: ctx.path,
            parent: ctx
          })
        ]).then(([left, right]) => handleParsed(left, right));
      } else {
        return handleParsed(this._def.left._parseSync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx
        }), this._def.right._parseSync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx
        }));
      }
    }
  };
  ZodIntersection.create = (left, right, params) => {
    return new ZodIntersection({
      left,
      right,
      typeName: ZodFirstPartyTypeKind.ZodIntersection,
      ...processCreateParams(params)
    });
  };
  ZodTuple = class ZodTuple extends ZodType {
    _parse(input) {
      const { status, ctx } = this._processInputParams(input);
      if (ctx.parsedType !== ZodParsedType.array) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.invalid_type,
          expected: ZodParsedType.array,
          received: ctx.parsedType
        });
        return INVALID;
      }
      if (ctx.data.length < this._def.items.length) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.too_small,
          minimum: this._def.items.length,
          inclusive: true,
          exact: false,
          type: "array"
        });
        return INVALID;
      }
      const rest = this._def.rest;
      if (!rest && ctx.data.length > this._def.items.length) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.too_big,
          maximum: this._def.items.length,
          inclusive: true,
          exact: false,
          type: "array"
        });
        status.dirty();
      }
      const items = [...ctx.data].map((item, itemIndex) => {
        const schema = this._def.items[itemIndex] || this._def.rest;
        if (!schema)
          return null;
        return schema._parse(new ParseInputLazyPath(ctx, item, ctx.path, itemIndex));
      }).filter((x) => !!x);
      if (ctx.common.async) {
        return Promise.all(items).then((results) => {
          return ParseStatus.mergeArray(status, results);
        });
      } else {
        return ParseStatus.mergeArray(status, items);
      }
    }
    get items() {
      return this._def.items;
    }
    rest(rest) {
      return new ZodTuple({
        ...this._def,
        rest
      });
    }
  };
  ZodTuple.create = (schemas, params) => {
    if (!Array.isArray(schemas)) {
      throw new Error("You must pass an array of schemas to z.tuple([ ... ])");
    }
    return new ZodTuple({
      items: schemas,
      typeName: ZodFirstPartyTypeKind.ZodTuple,
      rest: null,
      ...processCreateParams(params)
    });
  };
  ZodRecord = class ZodRecord extends ZodType {
    get keySchema() {
      return this._def.keyType;
    }
    get valueSchema() {
      return this._def.valueType;
    }
    _parse(input) {
      const { status, ctx } = this._processInputParams(input);
      if (ctx.parsedType !== ZodParsedType.object) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.invalid_type,
          expected: ZodParsedType.object,
          received: ctx.parsedType
        });
        return INVALID;
      }
      const pairs = [];
      const keyType = this._def.keyType;
      const valueType = this._def.valueType;
      for (const key in ctx.data) {
        pairs.push({
          key: keyType._parse(new ParseInputLazyPath(ctx, key, ctx.path, key)),
          value: valueType._parse(new ParseInputLazyPath(ctx, ctx.data[key], ctx.path, key)),
          alwaysSet: key in ctx.data
        });
      }
      if (ctx.common.async) {
        return ParseStatus.mergeObjectAsync(status, pairs);
      } else {
        return ParseStatus.mergeObjectSync(status, pairs);
      }
    }
    get element() {
      return this._def.valueType;
    }
    static create(first, second, third) {
      if (second instanceof ZodType) {
        return new ZodRecord({
          keyType: first,
          valueType: second,
          typeName: ZodFirstPartyTypeKind.ZodRecord,
          ...processCreateParams(third)
        });
      }
      return new ZodRecord({
        keyType: ZodString.create(),
        valueType: first,
        typeName: ZodFirstPartyTypeKind.ZodRecord,
        ...processCreateParams(second)
      });
    }
  };
  ZodMap = class ZodMap extends ZodType {
    get keySchema() {
      return this._def.keyType;
    }
    get valueSchema() {
      return this._def.valueType;
    }
    _parse(input) {
      const { status, ctx } = this._processInputParams(input);
      if (ctx.parsedType !== ZodParsedType.map) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.invalid_type,
          expected: ZodParsedType.map,
          received: ctx.parsedType
        });
        return INVALID;
      }
      const keyType = this._def.keyType;
      const valueType = this._def.valueType;
      const pairs = [...ctx.data.entries()].map(([key, value], index) => {
        return {
          key: keyType._parse(new ParseInputLazyPath(ctx, key, ctx.path, [index, "key"])),
          value: valueType._parse(new ParseInputLazyPath(ctx, value, ctx.path, [index, "value"]))
        };
      });
      if (ctx.common.async) {
        const finalMap = new Map;
        return Promise.resolve().then(async () => {
          for (const pair of pairs) {
            const key = await pair.key;
            const value = await pair.value;
            if (key.status === "aborted" || value.status === "aborted") {
              return INVALID;
            }
            if (key.status === "dirty" || value.status === "dirty") {
              status.dirty();
            }
            finalMap.set(key.value, value.value);
          }
          return { status: status.value, value: finalMap };
        });
      } else {
        const finalMap = new Map;
        for (const pair of pairs) {
          const key = pair.key;
          const value = pair.value;
          if (key.status === "aborted" || value.status === "aborted") {
            return INVALID;
          }
          if (key.status === "dirty" || value.status === "dirty") {
            status.dirty();
          }
          finalMap.set(key.value, value.value);
        }
        return { status: status.value, value: finalMap };
      }
    }
  };
  ZodMap.create = (keyType, valueType, params) => {
    return new ZodMap({
      valueType,
      keyType,
      typeName: ZodFirstPartyTypeKind.ZodMap,
      ...processCreateParams(params)
    });
  };
  ZodSet = class ZodSet extends ZodType {
    _parse(input) {
      const { status, ctx } = this._processInputParams(input);
      if (ctx.parsedType !== ZodParsedType.set) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.invalid_type,
          expected: ZodParsedType.set,
          received: ctx.parsedType
        });
        return INVALID;
      }
      const def = this._def;
      if (def.minSize !== null) {
        if (ctx.data.size < def.minSize.value) {
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_small,
            minimum: def.minSize.value,
            type: "set",
            inclusive: true,
            exact: false,
            message: def.minSize.message
          });
          status.dirty();
        }
      }
      if (def.maxSize !== null) {
        if (ctx.data.size > def.maxSize.value) {
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_big,
            maximum: def.maxSize.value,
            type: "set",
            inclusive: true,
            exact: false,
            message: def.maxSize.message
          });
          status.dirty();
        }
      }
      const valueType = this._def.valueType;
      function finalizeSet(elements) {
        const parsedSet = new Set;
        for (const element of elements) {
          if (element.status === "aborted")
            return INVALID;
          if (element.status === "dirty")
            status.dirty();
          parsedSet.add(element.value);
        }
        return { status: status.value, value: parsedSet };
      }
      const elements = [...ctx.data.values()].map((item, i) => valueType._parse(new ParseInputLazyPath(ctx, item, ctx.path, i)));
      if (ctx.common.async) {
        return Promise.all(elements).then((elements) => finalizeSet(elements));
      } else {
        return finalizeSet(elements);
      }
    }
    min(minSize, message) {
      return new ZodSet({
        ...this._def,
        minSize: { value: minSize, message: errorUtil.toString(message) }
      });
    }
    max(maxSize, message) {
      return new ZodSet({
        ...this._def,
        maxSize: { value: maxSize, message: errorUtil.toString(message) }
      });
    }
    size(size, message) {
      return this.min(size, message).max(size, message);
    }
    nonempty(message) {
      return this.min(1, message);
    }
  };
  ZodSet.create = (valueType, params) => {
    return new ZodSet({
      valueType,
      minSize: null,
      maxSize: null,
      typeName: ZodFirstPartyTypeKind.ZodSet,
      ...processCreateParams(params)
    });
  };
  ZodFunction = class ZodFunction extends ZodType {
    constructor() {
      super(...arguments);
      this.validate = this.implement;
    }
    _parse(input) {
      const { ctx } = this._processInputParams(input);
      if (ctx.parsedType !== ZodParsedType.function) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.invalid_type,
          expected: ZodParsedType.function,
          received: ctx.parsedType
        });
        return INVALID;
      }
      function makeArgsIssue(args, error) {
        return makeIssue({
          data: args,
          path: ctx.path,
          errorMaps: [ctx.common.contextualErrorMap, ctx.schemaErrorMap, getErrorMap(), en_default].filter((x) => !!x),
          issueData: {
            code: ZodIssueCode.invalid_arguments,
            argumentsError: error
          }
        });
      }
      function makeReturnsIssue(returns, error) {
        return makeIssue({
          data: returns,
          path: ctx.path,
          errorMaps: [ctx.common.contextualErrorMap, ctx.schemaErrorMap, getErrorMap(), en_default].filter((x) => !!x),
          issueData: {
            code: ZodIssueCode.invalid_return_type,
            returnTypeError: error
          }
        });
      }
      const params = { errorMap: ctx.common.contextualErrorMap };
      const fn = ctx.data;
      if (this._def.returns instanceof ZodPromise) {
        const me = this;
        return OK(async function(...args) {
          const error = new ZodError([]);
          const parsedArgs = await me._def.args.parseAsync(args, params).catch((e) => {
            error.addIssue(makeArgsIssue(args, e));
            throw error;
          });
          const result = await Reflect.apply(fn, this, parsedArgs);
          const parsedReturns = await me._def.returns._def.type.parseAsync(result, params).catch((e) => {
            error.addIssue(makeReturnsIssue(result, e));
            throw error;
          });
          return parsedReturns;
        });
      } else {
        const me = this;
        return OK(function(...args) {
          const parsedArgs = me._def.args.safeParse(args, params);
          if (!parsedArgs.success) {
            throw new ZodError([makeArgsIssue(args, parsedArgs.error)]);
          }
          const result = Reflect.apply(fn, this, parsedArgs.data);
          const parsedReturns = me._def.returns.safeParse(result, params);
          if (!parsedReturns.success) {
            throw new ZodError([makeReturnsIssue(result, parsedReturns.error)]);
          }
          return parsedReturns.data;
        });
      }
    }
    parameters() {
      return this._def.args;
    }
    returnType() {
      return this._def.returns;
    }
    args(...items) {
      return new ZodFunction({
        ...this._def,
        args: ZodTuple.create(items).rest(ZodUnknown.create())
      });
    }
    returns(returnType) {
      return new ZodFunction({
        ...this._def,
        returns: returnType
      });
    }
    implement(func) {
      const validatedFunc = this.parse(func);
      return validatedFunc;
    }
    strictImplement(func) {
      const validatedFunc = this.parse(func);
      return validatedFunc;
    }
    static create(args, returns, params) {
      return new ZodFunction({
        args: args ? args : ZodTuple.create([]).rest(ZodUnknown.create()),
        returns: returns || ZodUnknown.create(),
        typeName: ZodFirstPartyTypeKind.ZodFunction,
        ...processCreateParams(params)
      });
    }
  };
  ZodLazy = class ZodLazy extends ZodType {
    get schema() {
      return this._def.getter();
    }
    _parse(input) {
      const { ctx } = this._processInputParams(input);
      const lazySchema = this._def.getter();
      return lazySchema._parse({ data: ctx.data, path: ctx.path, parent: ctx });
    }
  };
  ZodLazy.create = (getter, params) => {
    return new ZodLazy({
      getter,
      typeName: ZodFirstPartyTypeKind.ZodLazy,
      ...processCreateParams(params)
    });
  };
  ZodLiteral = class ZodLiteral extends ZodType {
    _parse(input) {
      if (input.data !== this._def.value) {
        const ctx = this._getOrReturnCtx(input);
        addIssueToContext(ctx, {
          received: ctx.data,
          code: ZodIssueCode.invalid_literal,
          expected: this._def.value
        });
        return INVALID;
      }
      return { status: "valid", value: input.data };
    }
    get value() {
      return this._def.value;
    }
  };
  ZodLiteral.create = (value, params) => {
    return new ZodLiteral({
      value,
      typeName: ZodFirstPartyTypeKind.ZodLiteral,
      ...processCreateParams(params)
    });
  };
  ZodEnum = class ZodEnum extends ZodType {
    _parse(input) {
      if (typeof input.data !== "string") {
        const ctx = this._getOrReturnCtx(input);
        const expectedValues = this._def.values;
        addIssueToContext(ctx, {
          expected: util.joinValues(expectedValues),
          received: ctx.parsedType,
          code: ZodIssueCode.invalid_type
        });
        return INVALID;
      }
      if (!this._cache) {
        this._cache = new Set(this._def.values);
      }
      if (!this._cache.has(input.data)) {
        const ctx = this._getOrReturnCtx(input);
        const expectedValues = this._def.values;
        addIssueToContext(ctx, {
          received: ctx.data,
          code: ZodIssueCode.invalid_enum_value,
          options: expectedValues
        });
        return INVALID;
      }
      return OK(input.data);
    }
    get options() {
      return this._def.values;
    }
    get enum() {
      const enumValues = {};
      for (const val of this._def.values) {
        enumValues[val] = val;
      }
      return enumValues;
    }
    get Values() {
      const enumValues = {};
      for (const val of this._def.values) {
        enumValues[val] = val;
      }
      return enumValues;
    }
    get Enum() {
      const enumValues = {};
      for (const val of this._def.values) {
        enumValues[val] = val;
      }
      return enumValues;
    }
    extract(values, newDef = this._def) {
      return ZodEnum.create(values, {
        ...this._def,
        ...newDef
      });
    }
    exclude(values, newDef = this._def) {
      return ZodEnum.create(this.options.filter((opt) => !values.includes(opt)), {
        ...this._def,
        ...newDef
      });
    }
  };
  ZodEnum.create = createZodEnum;
  ZodNativeEnum = class ZodNativeEnum extends ZodType {
    _parse(input) {
      const nativeEnumValues = util.getValidEnumValues(this._def.values);
      const ctx = this._getOrReturnCtx(input);
      if (ctx.parsedType !== ZodParsedType.string && ctx.parsedType !== ZodParsedType.number) {
        const expectedValues = util.objectValues(nativeEnumValues);
        addIssueToContext(ctx, {
          expected: util.joinValues(expectedValues),
          received: ctx.parsedType,
          code: ZodIssueCode.invalid_type
        });
        return INVALID;
      }
      if (!this._cache) {
        this._cache = new Set(util.getValidEnumValues(this._def.values));
      }
      if (!this._cache.has(input.data)) {
        const expectedValues = util.objectValues(nativeEnumValues);
        addIssueToContext(ctx, {
          received: ctx.data,
          code: ZodIssueCode.invalid_enum_value,
          options: expectedValues
        });
        return INVALID;
      }
      return OK(input.data);
    }
    get enum() {
      return this._def.values;
    }
  };
  ZodNativeEnum.create = (values, params) => {
    return new ZodNativeEnum({
      values,
      typeName: ZodFirstPartyTypeKind.ZodNativeEnum,
      ...processCreateParams(params)
    });
  };
  ZodPromise = class ZodPromise extends ZodType {
    unwrap() {
      return this._def.type;
    }
    _parse(input) {
      const { ctx } = this._processInputParams(input);
      if (ctx.parsedType !== ZodParsedType.promise && ctx.common.async === false) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.invalid_type,
          expected: ZodParsedType.promise,
          received: ctx.parsedType
        });
        return INVALID;
      }
      const promisified = ctx.parsedType === ZodParsedType.promise ? ctx.data : Promise.resolve(ctx.data);
      return OK(promisified.then((data) => {
        return this._def.type.parseAsync(data, {
          path: ctx.path,
          errorMap: ctx.common.contextualErrorMap
        });
      }));
    }
  };
  ZodPromise.create = (schema, params) => {
    return new ZodPromise({
      type: schema,
      typeName: ZodFirstPartyTypeKind.ZodPromise,
      ...processCreateParams(params)
    });
  };
  ZodEffects = class ZodEffects extends ZodType {
    innerType() {
      return this._def.schema;
    }
    sourceType() {
      return this._def.schema._def.typeName === ZodFirstPartyTypeKind.ZodEffects ? this._def.schema.sourceType() : this._def.schema;
    }
    _parse(input) {
      const { status, ctx } = this._processInputParams(input);
      const effect = this._def.effect || null;
      const checkCtx = {
        addIssue: (arg) => {
          addIssueToContext(ctx, arg);
          if (arg.fatal) {
            status.abort();
          } else {
            status.dirty();
          }
        },
        get path() {
          return ctx.path;
        }
      };
      checkCtx.addIssue = checkCtx.addIssue.bind(checkCtx);
      if (effect.type === "preprocess") {
        const processed = effect.transform(ctx.data, checkCtx);
        if (ctx.common.async) {
          return Promise.resolve(processed).then(async (processed) => {
            if (status.value === "aborted")
              return INVALID;
            const result = await this._def.schema._parseAsync({
              data: processed,
              path: ctx.path,
              parent: ctx
            });
            if (result.status === "aborted")
              return INVALID;
            if (result.status === "dirty")
              return DIRTY(result.value);
            if (status.value === "dirty")
              return DIRTY(result.value);
            return result;
          });
        } else {
          if (status.value === "aborted")
            return INVALID;
          const result = this._def.schema._parseSync({
            data: processed,
            path: ctx.path,
            parent: ctx
          });
          if (result.status === "aborted")
            return INVALID;
          if (result.status === "dirty")
            return DIRTY(result.value);
          if (status.value === "dirty")
            return DIRTY(result.value);
          return result;
        }
      }
      if (effect.type === "refinement") {
        const executeRefinement = (acc) => {
          const result = effect.refinement(acc, checkCtx);
          if (ctx.common.async) {
            return Promise.resolve(result);
          }
          if (result instanceof Promise) {
            throw new Error("Async refinement encountered during synchronous parse operation. Use .parseAsync instead.");
          }
          return acc;
        };
        if (ctx.common.async === false) {
          const inner = this._def.schema._parseSync({
            data: ctx.data,
            path: ctx.path,
            parent: ctx
          });
          if (inner.status === "aborted")
            return INVALID;
          if (inner.status === "dirty")
            status.dirty();
          executeRefinement(inner.value);
          return { status: status.value, value: inner.value };
        } else {
          return this._def.schema._parseAsync({ data: ctx.data, path: ctx.path, parent: ctx }).then((inner) => {
            if (inner.status === "aborted")
              return INVALID;
            if (inner.status === "dirty")
              status.dirty();
            return executeRefinement(inner.value).then(() => {
              return { status: status.value, value: inner.value };
            });
          });
        }
      }
      if (effect.type === "transform") {
        if (ctx.common.async === false) {
          const base = this._def.schema._parseSync({
            data: ctx.data,
            path: ctx.path,
            parent: ctx
          });
          if (!isValid(base))
            return INVALID;
          const result = effect.transform(base.value, checkCtx);
          if (result instanceof Promise) {
            throw new Error(`Asynchronous transform encountered during synchronous parse operation. Use .parseAsync instead.`);
          }
          return { status: status.value, value: result };
        } else {
          return this._def.schema._parseAsync({ data: ctx.data, path: ctx.path, parent: ctx }).then((base) => {
            if (!isValid(base))
              return INVALID;
            return Promise.resolve(effect.transform(base.value, checkCtx)).then((result) => ({
              status: status.value,
              value: result
            }));
          });
        }
      }
      util.assertNever(effect);
    }
  };
  ZodEffects.create = (schema, effect, params) => {
    return new ZodEffects({
      schema,
      typeName: ZodFirstPartyTypeKind.ZodEffects,
      effect,
      ...processCreateParams(params)
    });
  };
  ZodEffects.createWithPreprocess = (preprocess, schema, params) => {
    return new ZodEffects({
      schema,
      effect: { type: "preprocess", transform: preprocess },
      typeName: ZodFirstPartyTypeKind.ZodEffects,
      ...processCreateParams(params)
    });
  };
  ZodOptional = class ZodOptional extends ZodType {
    _parse(input) {
      const parsedType = this._getType(input);
      if (parsedType === ZodParsedType.undefined) {
        return OK(undefined);
      }
      return this._def.innerType._parse(input);
    }
    unwrap() {
      return this._def.innerType;
    }
  };
  ZodOptional.create = (type, params) => {
    return new ZodOptional({
      innerType: type,
      typeName: ZodFirstPartyTypeKind.ZodOptional,
      ...processCreateParams(params)
    });
  };
  ZodNullable = class ZodNullable extends ZodType {
    _parse(input) {
      const parsedType = this._getType(input);
      if (parsedType === ZodParsedType.null) {
        return OK(null);
      }
      return this._def.innerType._parse(input);
    }
    unwrap() {
      return this._def.innerType;
    }
  };
  ZodNullable.create = (type, params) => {
    return new ZodNullable({
      innerType: type,
      typeName: ZodFirstPartyTypeKind.ZodNullable,
      ...processCreateParams(params)
    });
  };
  ZodDefault = class ZodDefault extends ZodType {
    _parse(input) {
      const { ctx } = this._processInputParams(input);
      let data = ctx.data;
      if (ctx.parsedType === ZodParsedType.undefined) {
        data = this._def.defaultValue();
      }
      return this._def.innerType._parse({
        data,
        path: ctx.path,
        parent: ctx
      });
    }
    removeDefault() {
      return this._def.innerType;
    }
  };
  ZodDefault.create = (type, params) => {
    return new ZodDefault({
      innerType: type,
      typeName: ZodFirstPartyTypeKind.ZodDefault,
      defaultValue: typeof params.default === "function" ? params.default : () => params.default,
      ...processCreateParams(params)
    });
  };
  ZodCatch = class ZodCatch extends ZodType {
    _parse(input) {
      const { ctx } = this._processInputParams(input);
      const newCtx = {
        ...ctx,
        common: {
          ...ctx.common,
          issues: []
        }
      };
      const result = this._def.innerType._parse({
        data: newCtx.data,
        path: newCtx.path,
        parent: {
          ...newCtx
        }
      });
      if (isAsync(result)) {
        return result.then((result) => {
          return {
            status: "valid",
            value: result.status === "valid" ? result.value : this._def.catchValue({
              get error() {
                return new ZodError(newCtx.common.issues);
              },
              input: newCtx.data
            })
          };
        });
      } else {
        return {
          status: "valid",
          value: result.status === "valid" ? result.value : this._def.catchValue({
            get error() {
              return new ZodError(newCtx.common.issues);
            },
            input: newCtx.data
          })
        };
      }
    }
    removeCatch() {
      return this._def.innerType;
    }
  };
  ZodCatch.create = (type, params) => {
    return new ZodCatch({
      innerType: type,
      typeName: ZodFirstPartyTypeKind.ZodCatch,
      catchValue: typeof params.catch === "function" ? params.catch : () => params.catch,
      ...processCreateParams(params)
    });
  };
  ZodNaN = class ZodNaN extends ZodType {
    _parse(input) {
      const parsedType = this._getType(input);
      if (parsedType !== ZodParsedType.nan) {
        const ctx = this._getOrReturnCtx(input);
        addIssueToContext(ctx, {
          code: ZodIssueCode.invalid_type,
          expected: ZodParsedType.nan,
          received: ctx.parsedType
        });
        return INVALID;
      }
      return { status: "valid", value: input.data };
    }
  };
  ZodNaN.create = (params) => {
    return new ZodNaN({
      typeName: ZodFirstPartyTypeKind.ZodNaN,
      ...processCreateParams(params)
    });
  };
  BRAND = Symbol("zod_brand");
  ZodBranded = class ZodBranded extends ZodType {
    _parse(input) {
      const { ctx } = this._processInputParams(input);
      const data = ctx.data;
      return this._def.type._parse({
        data,
        path: ctx.path,
        parent: ctx
      });
    }
    unwrap() {
      return this._def.type;
    }
  };
  ZodPipeline = class ZodPipeline extends ZodType {
    _parse(input) {
      const { status, ctx } = this._processInputParams(input);
      if (ctx.common.async) {
        const handleAsync = async () => {
          const inResult = await this._def.in._parseAsync({
            data: ctx.data,
            path: ctx.path,
            parent: ctx
          });
          if (inResult.status === "aborted")
            return INVALID;
          if (inResult.status === "dirty") {
            status.dirty();
            return DIRTY(inResult.value);
          } else {
            return this._def.out._parseAsync({
              data: inResult.value,
              path: ctx.path,
              parent: ctx
            });
          }
        };
        return handleAsync();
      } else {
        const inResult = this._def.in._parseSync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx
        });
        if (inResult.status === "aborted")
          return INVALID;
        if (inResult.status === "dirty") {
          status.dirty();
          return {
            status: "dirty",
            value: inResult.value
          };
        } else {
          return this._def.out._parseSync({
            data: inResult.value,
            path: ctx.path,
            parent: ctx
          });
        }
      }
    }
    static create(a, b) {
      return new ZodPipeline({
        in: a,
        out: b,
        typeName: ZodFirstPartyTypeKind.ZodPipeline
      });
    }
  };
  ZodReadonly = class ZodReadonly extends ZodType {
    _parse(input) {
      const result = this._def.innerType._parse(input);
      const freeze = (data) => {
        if (isValid(data)) {
          data.value = Object.freeze(data.value);
        }
        return data;
      };
      return isAsync(result) ? result.then((data) => freeze(data)) : freeze(result);
    }
    unwrap() {
      return this._def.innerType;
    }
  };
  ZodReadonly.create = (type, params) => {
    return new ZodReadonly({
      innerType: type,
      typeName: ZodFirstPartyTypeKind.ZodReadonly,
      ...processCreateParams(params)
    });
  };
  late = {
    object: ZodObject.lazycreate
  };
  (function(ZodFirstPartyTypeKind) {
    ZodFirstPartyTypeKind["ZodString"] = "ZodString";
    ZodFirstPartyTypeKind["ZodNumber"] = "ZodNumber";
    ZodFirstPartyTypeKind["ZodNaN"] = "ZodNaN";
    ZodFirstPartyTypeKind["ZodBigInt"] = "ZodBigInt";
    ZodFirstPartyTypeKind["ZodBoolean"] = "ZodBoolean";
    ZodFirstPartyTypeKind["ZodDate"] = "ZodDate";
    ZodFirstPartyTypeKind["ZodSymbol"] = "ZodSymbol";
    ZodFirstPartyTypeKind["ZodUndefined"] = "ZodUndefined";
    ZodFirstPartyTypeKind["ZodNull"] = "ZodNull";
    ZodFirstPartyTypeKind["ZodAny"] = "ZodAny";
    ZodFirstPartyTypeKind["ZodUnknown"] = "ZodUnknown";
    ZodFirstPartyTypeKind["ZodNever"] = "ZodNever";
    ZodFirstPartyTypeKind["ZodVoid"] = "ZodVoid";
    ZodFirstPartyTypeKind["ZodArray"] = "ZodArray";
    ZodFirstPartyTypeKind["ZodObject"] = "ZodObject";
    ZodFirstPartyTypeKind["ZodUnion"] = "ZodUnion";
    ZodFirstPartyTypeKind["ZodDiscriminatedUnion"] = "ZodDiscriminatedUnion";
    ZodFirstPartyTypeKind["ZodIntersection"] = "ZodIntersection";
    ZodFirstPartyTypeKind["ZodTuple"] = "ZodTuple";
    ZodFirstPartyTypeKind["ZodRecord"] = "ZodRecord";
    ZodFirstPartyTypeKind["ZodMap"] = "ZodMap";
    ZodFirstPartyTypeKind["ZodSet"] = "ZodSet";
    ZodFirstPartyTypeKind["ZodFunction"] = "ZodFunction";
    ZodFirstPartyTypeKind["ZodLazy"] = "ZodLazy";
    ZodFirstPartyTypeKind["ZodLiteral"] = "ZodLiteral";
    ZodFirstPartyTypeKind["ZodEnum"] = "ZodEnum";
    ZodFirstPartyTypeKind["ZodEffects"] = "ZodEffects";
    ZodFirstPartyTypeKind["ZodNativeEnum"] = "ZodNativeEnum";
    ZodFirstPartyTypeKind["ZodOptional"] = "ZodOptional";
    ZodFirstPartyTypeKind["ZodNullable"] = "ZodNullable";
    ZodFirstPartyTypeKind["ZodDefault"] = "ZodDefault";
    ZodFirstPartyTypeKind["ZodCatch"] = "ZodCatch";
    ZodFirstPartyTypeKind["ZodPromise"] = "ZodPromise";
    ZodFirstPartyTypeKind["ZodBranded"] = "ZodBranded";
    ZodFirstPartyTypeKind["ZodPipeline"] = "ZodPipeline";
    ZodFirstPartyTypeKind["ZodReadonly"] = "ZodReadonly";
  })(ZodFirstPartyTypeKind || (ZodFirstPartyTypeKind = {}));
  stringType = ZodString.create;
  numberType = ZodNumber.create;
  nanType = ZodNaN.create;
  bigIntType = ZodBigInt.create;
  booleanType = ZodBoolean.create;
  dateType = ZodDate.create;
  symbolType = ZodSymbol.create;
  undefinedType = ZodUndefined.create;
  nullType = ZodNull.create;
  anyType = ZodAny.create;
  unknownType = ZodUnknown.create;
  neverType = ZodNever.create;
  voidType = ZodVoid.create;
  arrayType = ZodArray.create;
  objectType = ZodObject.create;
  strictObjectType = ZodObject.strictCreate;
  unionType = ZodUnion.create;
  discriminatedUnionType = ZodDiscriminatedUnion.create;
  intersectionType = ZodIntersection.create;
  tupleType = ZodTuple.create;
  recordType = ZodRecord.create;
  mapType = ZodMap.create;
  setType = ZodSet.create;
  functionType = ZodFunction.create;
  lazyType = ZodLazy.create;
  literalType = ZodLiteral.create;
  enumType = ZodEnum.create;
  nativeEnumType = ZodNativeEnum.create;
  promiseType = ZodPromise.create;
  effectsType = ZodEffects.create;
  optionalType = ZodOptional.create;
  nullableType = ZodNullable.create;
  preprocessType = ZodEffects.createWithPreprocess;
  pipelineType = ZodPipeline.create;
});

// node_modules/.bun/zod@3.25.76/node_modules/zod/v3/external.js
var init_external = __esm(() => {
  init_errors();
  init_parseUtil();
  init_typeAliases();
  init_util();
  init_types();
  init_ZodError();
});

// node_modules/.bun/zod@3.25.76/node_modules/zod/index.js
var init_zod = __esm(() => {
  init_external();
  init_external();
});

// packages/core/src/utils/naming.ts
function pascalCase(str) {
  if (!str)
    return "";
  return str.replace(/[-_\s]+(\w)/g, (_, c) => c.toUpperCase()).replace(/[-_\s]+/g, "").replace(/^(\w)/, (_, c) => c.toUpperCase());
}
function camelCase(str) {
  if (!str)
    return "";
  const pascal = pascalCase(str);
  return pascal.charAt(0).toLowerCase() + pascal.slice(1);
}
function snakeCase(str) {
  if (!str)
    return "";
  if (/^[A-Z0-9_]+$/.test(str)) {
    return str.toLowerCase();
  }
  return str.replace(/([A-Z]+)([A-Z][a-z])/g, "$1_$2").replace(/([a-z0-9])([A-Z])/g, "$1_$2").replace(/[-\s]+/g, "_").toLowerCase().replace(/_{2,}/g, "_").replace(/^_/, "");
}
function kebabCase(str) {
  if (!str)
    return "";
  return str.replace(/\s+/g, "-").replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase().replace(/[_]+/g, "-").replace(/-+/g, "-").replace(/^-|^-|-$/g, "");
}
function plural(str) {
  if (!str)
    return "";
  if (str.endsWith("y"))
    return str.slice(0, -1) + "ies";
  if (str.endsWith("s") || str.endsWith("x") || str.endsWith("ch"))
    return str + "es";
  return str + "s";
}
function singular(str) {
  if (!str)
    return "";
  if (str.endsWith("ies"))
    return str.slice(0, -3) + "y";
  if (str.endsWith("es"))
    return str.slice(0, -2);
  if (str.endsWith("s"))
    return str.slice(0, -1);
  return str;
}

// packages/core/src/types/sys-dictionary.types.ts
function isSystemTable(tableName) {
  return tableName.startsWith(SYS_TABLE_PREFIX);
}
function isBusinessTable(tableName) {
  return tableName.startsWith(BUS_TABLE_PREFIX);
}
var SYS_TABLE_PREFIX = "sys_", BUS_TABLE_PREFIX = "bus_", AccessLevel, WindowType, ReferenceType, SysTableSchema, SysColumnSchema, SysFieldSchema, SysWindowSchema, SysTabSchema, SysUserSchema, SysRoleSchema, SysReferenceSchema;
var init_sys_dictionary_types = __esm(() => {
  init_zod();
  AccessLevel = {
    SYSTEM: "S",
    CLIENT: "C",
    ORGANIZATION: "O",
    CLIENT_ORG: "CO",
    ALL: "A"
  };
  WindowType = {
    MAINTAIN: "M",
    TRANSACTION: "T",
    QUERY: "Q"
  };
  ReferenceType = {
    STRING: 10,
    INTEGER: 11,
    AMOUNT: 12,
    ID: 13,
    TEXT: 14,
    DATE: 15,
    DATETIME: 16,
    LIST: 17,
    TABLE: 18,
    TABLE_DIRECT: 19,
    YES_NO: 20,
    LOCATION: 21,
    LOCATOR: 22,
    ACCOUNT: 23,
    URL: 24,
    IMAGE: 25,
    FILE: 26,
    COLOR: 27,
    JSON: 28,
    PASSWORD: 29,
    EMAIL: 30,
    PHONE: 31
  };
  SysTableSchema = objectType({
    sys_table_id: stringType().uuid(),
    table_name: stringType().min(1).max(100),
    name: stringType().min(1).max(100),
    description: stringType().optional(),
    icon: stringType().max(100).optional(),
    access_level: enumType(["S", "C", "O", "CO", "A"]),
    is_view: booleanType(),
    is_document: booleanType(),
    is_high_volume: booleanType(),
    is_changelog: booleanType(),
    replication_type: stringType().optional(),
    sys_window_id: stringType().uuid().optional(),
    po_window_id: stringType().uuid().optional(),
    entity_type: stringType(),
    is_active: booleanType(),
    created_by: stringType(),
    updated_by: stringType(),
    created_at: dateType(),
    updated_at: dateType()
  });
  SysColumnSchema = objectType({
    sys_column_id: stringType().uuid(),
    sys_table_id: stringType().uuid(),
    column_name: stringType().min(1).max(100),
    name: stringType().min(1).max(100),
    description: stringType().optional(),
    sys_reference_id: numberType(),
    sys_val_rule_id: stringType().uuid().optional(),
    field_length: numberType().optional(),
    default_value: stringType().optional(),
    value_min: stringType().optional(),
    value_max: stringType().optional(),
    is_key: booleanType(),
    is_parent: booleanType(),
    is_mandatory: booleanType(),
    is_updateable: booleanType(),
    is_identifier: booleanType(),
    is_selection_column: booleanType(),
    is_translated: booleanType(),
    is_encrypted: booleanType(),
    is_allow_logging: booleanType(),
    is_allow_copy: booleanType(),
    seq_no: numberType(),
    callout: stringType().optional(),
    read_only_logic: stringType().optional(),
    mandatory_logic: stringType().optional(),
    format_pattern: stringType().optional(),
    entity_type: stringType(),
    is_active: booleanType(),
    created_by: stringType(),
    updated_by: stringType(),
    created_at: dateType(),
    updated_at: dateType()
  });
  SysFieldSchema = objectType({
    sys_field_id: stringType().uuid(),
    sys_tab_id: stringType().uuid(),
    sys_column_id: stringType().uuid(),
    sys_field_group_id: stringType().uuid().optional(),
    name: stringType().min(1).max(100),
    description: stringType().optional(),
    help: stringType().optional(),
    seq_no: numberType(),
    seq_no_grid: numberType(),
    display_length: numberType().optional(),
    x_position: numberType().optional(),
    y_position: numberType().optional(),
    column_span: numberType().optional(),
    num_lines: numberType().optional(),
    is_displayed: booleanType(),
    is_displayed_grid: booleanType(),
    is_read_only: booleanType(),
    is_encrypted: booleanType(),
    is_same_line: booleanType(),
    is_heading: booleanType(),
    is_field_only: booleanType(),
    display_logic: stringType().optional(),
    read_only_logic: stringType().optional(),
    mandatory_logic: stringType().optional(),
    obscure_type: stringType().optional(),
    included_tab_id: stringType().uuid().optional(),
    default_value: stringType().optional(),
    sort_no: numberType().optional(),
    entity_type: stringType(),
    is_active: booleanType(),
    created_by: stringType(),
    updated_by: stringType(),
    created_at: dateType(),
    updated_at: dateType()
  });
  SysWindowSchema = objectType({
    sys_window_id: stringType().uuid(),
    name: stringType().min(1).max(100),
    description: stringType().optional(),
    help: stringType().optional(),
    window_type: enumType(["M", "T", "Q"]),
    is_sales_transaction: booleanType(),
    is_default: booleanType(),
    entity_type: stringType(),
    is_active: booleanType(),
    created_by: stringType(),
    updated_by: stringType(),
    created_at: dateType(),
    updated_at: dateType()
  });
  SysTabSchema = objectType({
    sys_tab_id: stringType().uuid(),
    sys_window_id: stringType().uuid(),
    sys_table_id: stringType().uuid(),
    name: stringType().min(1).max(100),
    description: stringType().optional(),
    help: stringType().optional(),
    tab_level: numberType(),
    seq_no: numberType(),
    is_single_row: booleanType(),
    has_tree: booleanType(),
    is_info_tab: booleanType(),
    is_translation_tab: booleanType(),
    is_read_only: booleanType(),
    is_insert_record: booleanType(),
    is_advanced_tab: booleanType(),
    parent_column_id: stringType().uuid().optional(),
    link_column_id: stringType().uuid().optional(),
    order_by_clause: stringType().optional(),
    where_clause: stringType().optional(),
    display_logic: stringType().optional(),
    read_only_logic: stringType().optional(),
    commit_warning: stringType().optional(),
    entity_type: stringType(),
    is_active: booleanType(),
    created_by: stringType(),
    updated_by: stringType(),
    created_at: dateType(),
    updated_at: dateType()
  });
  SysUserSchema = objectType({
    sys_user_id: stringType().uuid(),
    name: stringType().min(1).max(100),
    email: stringType().email(),
    password_hash: stringType(),
    description: stringType().optional(),
    is_system_user: booleanType(),
    is_sales_rep: booleanType(),
    login_date: dateType().optional(),
    login_failure_count: numberType(),
    is_locked: booleanType(),
    is_account_verified: booleanType(),
    notification_type: stringType().optional(),
    supervisor_id: stringType().uuid().optional(),
    default_sys_role_id: stringType().uuid().optional(),
    entity_type: stringType(),
    is_active: booleanType(),
    created_by: stringType(),
    updated_by: stringType(),
    created_at: dateType(),
    updated_at: dateType()
  });
  SysRoleSchema = objectType({
    sys_role_id: stringType().uuid(),
    name: stringType().min(1).max(100),
    description: stringType().optional(),
    user_level: stringType(),
    is_master_role: booleanType(),
    is_can_export: booleanType(),
    is_can_report: booleanType(),
    is_personal_lock: booleanType(),
    is_personal_access: booleanType(),
    max_query_records: numberType(),
    connection_profile: stringType().optional(),
    preference_type: stringType().optional(),
    is_show_accounting: booleanType(),
    entity_type: stringType(),
    is_active: booleanType(),
    created_by: stringType(),
    updated_by: stringType(),
    created_at: dateType(),
    updated_at: dateType()
  });
  SysReferenceSchema = objectType({
    sys_reference_id: numberType(),
    name: stringType().min(1).max(100),
    description: stringType().optional(),
    validation_type: enumType(["S", "L", "T", "R"]),
    vformat: stringType().optional(),
    entity_type: stringType(),
    is_active: booleanType(),
    created_by: stringType(),
    updated_by: stringType(),
    created_at: dateType(),
    updated_at: dateType()
  });
});

// packages/core/src/types/bus-entity.types.ts
function attributeTypeToReferenceId(type) {
  const typeMapping = {
    string: ReferenceType.STRING,
    integer: ReferenceType.INTEGER,
    decimal: ReferenceType.AMOUNT,
    boolean: ReferenceType.YES_NO,
    date: ReferenceType.DATE,
    datetime: ReferenceType.DATETIME,
    text: ReferenceType.TEXT,
    json: ReferenceType.JSON
  };
  return typeMapping[type];
}
function entityToBusEntity(entity, declared) {
  const tableName = entity.tableName.startsWith(BUS_TABLE_PREFIX) ? entity.tableName : `${BUS_TABLE_PREFIX}${entity.tableName}`;
  return {
    ...entity,
    tableName,
    originalName: entity.name,
    displayName: formatDisplayName(entity.name),
    windowOwner: entity.parentEntity ?? entity.name,
    indexes: mergeIndexes(entity),
    attributes: withIdentifiers(entity.attributes.map((attr, index) => attributeToBusAttribute(attr, index, entity.primaryKey, declared)), entity.primaryKey)
  };
}
function withIdentifiers(attributes, primaryKey) {
  const identifiers = new Set(identifierColumnNames(attributes, primaryKey));
  return attributes.map((attribute) => ({
    ...attribute,
    isIdentifier: identifiers.has(attribute.name)
  }));
}
function mergeIndexes(entity) {
  const merged = [...entity.indexes ?? []];
  const claimed = new Set(merged.map((index) => index.columns.join(",")));
  for (const attribute of entity.attributes) {
    if (attribute.name !== "name")
      continue;
    if (claimed.has(attribute.name))
      continue;
    claimed.add(attribute.name);
    merged.push({ columns: [attribute.name], unique: Boolean(attribute.unique) });
  }
  return merged;
}
function identifierColumnNames(attributes, primaryKey) {
  const names = new Set(attributes.map((attribute) => attribute.name));
  const has = (name) => names.has(name);
  if (has("name") && attributes.some((attribute) => attribute.name === "code" && attribute.unique)) {
    return ["code", "name"];
  }
  for (const candidate of ["name", "full_name", "display_name", "title", "label", "subject"]) {
    if (has(candidate))
      return [candidate];
  }
  if (has("first_name") && has("last_name"))
    return ["first_name", "last_name"];
  for (const candidate of ["code", "reference", "number"]) {
    if (has(candidate))
      return [candidate];
  }
  const quoted = attributes.find((attribute) => attribute.name !== primaryKey && !attribute.isForeignKey && /_(number|code|reference)$/.test(attribute.name));
  if (quoted)
    return [quoted.name];
  const prose = attributes.find((attribute) => attribute.name !== primaryKey && !attribute.isForeignKey && attribute.type === "text");
  if (prose)
    return [prose.name];
  const references = attributes.filter((attribute) => attribute.name !== primaryKey && attribute.isForeignKey && (attribute.references !== undefined || isForeignKeyColumnName(attribute.name)));
  if (references.length >= 2)
    return references.slice(0, 2).map((attribute) => attribute.name);
  const readable = attributes.find((attribute) => attribute.name !== primaryKey && !attribute.isForeignKey && !attribute.name.endsWith("_id") && (attribute.type === "string" || attribute.type === "text"));
  return readable ? [readable.name] : [];
}
function attributeReferenceId(attr, entityPrimaryKey) {
  if (attr.name === "id")
    return ReferenceType.ID;
  if (entityPrimaryKey && attr.name === entityPrimaryKey)
    return ReferenceType.ID;
  if (attr.isForeignKey && (attr.references !== undefined || isForeignKeyColumnName(attr.name))) {
    return ReferenceType.TABLE_DIRECT;
  }
  if (attr.enumReferenceId)
    return attr.enumReferenceId;
  if (attr.semanticType)
    return SEMANTIC_REFERENCE[attr.semanticType];
  const byName = referenceFromColumnName(attr);
  if (byName !== undefined)
    return byName;
  return attributeTypeToReferenceId(attr.type);
}
function referenceFromColumnName(attr) {
  if (attr.type !== "string" && attr.type !== "text")
    return;
  if (/email/i.test(attr.name))
    return ReferenceType.EMAIL;
  if (/phone|mobile|tel/i.test(attr.name))
    return ReferenceType.PHONE;
  if (/url|website|link/i.test(attr.name))
    return ReferenceType.URL;
  return;
}
function isForeignKeyColumnName(columnName) {
  return columnName.endsWith("_id") || columnName.endsWith("_by") || PERSON_ROLE_COLUMN_NAMES.has(columnName);
}
function foreignKeyTargetTable(columnName, tables, explicitTable) {
  if (explicitTable !== undefined)
    return tables.has(explicitTable) ? explicitTable : undefined;
  const person = () => PERSON_TABLES.find((table) => tables.has(table));
  if (PERSON_ROLE_COLUMN_NAMES.has(columnName))
    return person();
  const stripped = QUALIFIER_PREFIXES.map((prefix) => columnName.startsWith(prefix) ? columnName.slice(prefix.length) : undefined).find((value) => value !== undefined) ?? columnName;
  if (PERSON_ROLE_COLUMN_NAMES.has(stripped))
    return person();
  if (stripped.endsWith("_by_id") || stripped.endsWith("_by"))
    return person();
  if (stripped === "id")
    return;
  if (!stripped.endsWith("_id"))
    return;
  const candidate = `bus_${stripped.slice(0, -"_id".length)}`;
  return tables.has(candidate) ? candidate : undefined;
}
function foreignKeyLabelStem(attr, entityPrimaryKey) {
  const isTableDirect = attributeReferenceId(attr, entityPrimaryKey) === ReferenceType.TABLE_DIRECT;
  if (isTableDirect && attr.name.endsWith("_id") && !attr.name.endsWith("_by_id")) {
    return attr.name.slice(0, -"_id".length);
  }
  return attr.name;
}
function declaredEntityNames(entities) {
  return new Map(entities.map((entity) => [entity.name.toLowerCase().replace(/_/g, ""), entity.name]));
}
function attributeDisplayName(attr, entityPrimaryKey, declared) {
  const stem = foreignKeyLabelStem(attr, entityPrimaryKey);
  if (stem !== attr.name) {
    const resolved = declared?.get(stem.toLowerCase().replace(/_/g, ""));
    if (resolved)
      return formatDisplayName(resolved);
  }
  return formatDisplayName(stem);
}
function attributeToBusAttribute(attr, index, entityPrimaryKey, declared) {
  return {
    ...attr,
    columnName: attr.name,
    displayName: attributeDisplayName(attr, entityPrimaryKey, declared),
    referenceId: attributeReferenceId(attr, entityPrimaryKey),
    seqNo: (index + 1) * 10,
    isIdentifier: false,
    ...attr.isForeignKey && attr.references !== undefined ? { referencesTable: `${BUS_TABLE_PREFIX}${snakeCase(attr.references)}` } : {}
  };
}
function getEntityIcon(name, tableName) {
  const lowerName = name.toLowerCase();
  const lowerTableName = tableName.toLowerCase();
  if (lowerName.includes("patient") || lowerName.includes("person") || lowerName.includes("customer")) {
    return "User";
  }
  if (lowerName.includes("staff") || lowerName.includes("employee") || lowerName.includes("provider")) {
    return "UserCircle";
  }
  if (lowerName.includes("user") || lowerName.includes("admin")) {
    return "Users";
  }
  if (lowerName.includes("appointment") || lowerName.includes("schedule")) {
    return "Calendar";
  }
  if (lowerName.includes("allergy")) {
    return "ShieldAlert";
  }
  if (lowerName.includes("encounter") || lowerName.includes("visit")) {
    return "Stethoscope";
  }
  if (lowerName.includes("insurance")) {
    return "Shield";
  }
  if (lowerName.includes("department") || lowerName.includes("ward")) {
    return "Building2";
  }
  if (lowerName.includes("bed") || lowerName.includes("room")) {
    return "BedDouble";
  }
  if (lowerName.includes("prescription") || lowerName.includes("medication")) {
    return "Pill";
  }
  if (lowerName.includes("diagnosis") || lowerName.includes("condition")) {
    return "Activity";
  }
  if (lowerName.includes("document") || lowerName.includes("file") || lowerName.includes("attachment")) {
    return "FileText";
  }
  if (lowerName.includes("date") || lowerName.includes("time") || lowerName.includes("shift")) {
    return "Clock";
  }
  if (lowerName.includes("location") || lowerName.includes("address")) {
    return "MapPin";
  }
  if (lowerName.includes("warehouse") || lowerName.includes("inventory")) {
    return "Package";
  }
  if (lowerName.includes("order") || lowerName.includes("invoice") || lowerName.includes("receipt")) {
    return "Receipt";
  }
  if (lowerName.includes("payment") || lowerName.includes("transaction")) {
    return "CreditCard";
  }
  if (lowerName.includes("quote") || lowerName.includes("proposal")) {
    return "FileText";
  }
  if (lowerName.includes("product") || lowerName.includes("item")) {
    return "Package";
  }
  if (lowerName.includes("category") || lowerName.includes("group")) {
    return "FolderTree";
  }
  if (lowerName.includes("price") || lowerName.includes("cost")) {
    return "DollarSign";
  }
  if (lowerName.includes("account") || lowerName.includes("ledger")) {
    return "Wallet";
  }
  if (lowerName.includes("budget")) {
    return "PieChart";
  }
  if (lowerName.includes("email") || lowerName.includes("message") || lowerName.includes("notification")) {
    return "Mail";
  }
  if (lowerName.includes("phone") || lowerName.includes("call")) {
    return "Phone";
  }
  if (lowerName.includes("status") || lowerName.includes("state")) {
    return "Status";
  }
  if (lowerName.includes("config") || lowerName.includes("setting") || lowerName.includes("preference")) {
    return "Settings";
  }
  if (lowerName.includes("role") || lowerName.includes("permission") || lowerName.includes("access")) {
    return "Lock";
  }
  if (lowerName.includes("report") || lowerName.includes("analytics") || lowerName.includes("chart")) {
    return "BarChart";
  }
  if (lowerName.includes("log") || lowerName.includes("audit") || lowerName.includes("history")) {
    return "History";
  }
  if (lowerTableName.includes("sys_")) {
    return "Settings";
  }
  return "Table";
}
function generateSysTable(entity, config = defaultDictionaryConfig) {
  return {
    table_name: entity.tableName,
    name: entity.displayName,
    description: entity.description,
    icon: getEntityIcon(entity.displayName, entity.tableName),
    access_level: config.defaultAccessLevel,
    is_view: false,
    is_document: false,
    is_high_volume: false,
    is_changelog: true,
    entity_type: config.defaultEntityType,
    is_active: true,
    created_by: config.createdBy,
    updated_by: config.createdBy
  };
}
function generateSysWindow(entity, config = defaultDictionaryConfig) {
  return {
    name: entity.displayName,
    description: `Maintain ${entity.displayName} records`,
    help: undefined,
    window_type: WindowType.MAINTAIN,
    is_sales_transaction: false,
    is_default: true,
    entity_type: config.defaultEntityType,
    is_active: true,
    created_by: config.createdBy,
    updated_by: config.createdBy
  };
}
function generateSysFieldGroups(entityName, config = defaultDictionaryConfig) {
  if (!config.includeFieldGroups) {
    return [];
  }
  return [
    {
      name: "General",
      description: `General information for ${entityName}`,
      field_group_type: "C",
      is_collapsed_by_default: false,
      entity_type: config.defaultEntityType,
      is_active: true,
      created_by: config.createdBy,
      updated_by: config.createdBy
    },
    {
      name: "Details",
      description: `Detailed information for ${entityName}`,
      field_group_type: "C",
      is_collapsed_by_default: true,
      entity_type: config.defaultEntityType,
      is_active: true,
      created_by: config.createdBy,
      updated_by: config.createdBy
    }
  ];
}
function formatDisplayName(name) {
  return splitWords(name).map(titleWord).join(" ");
}
function splitWords(name) {
  return name.replace(/[_\s-]+/g, " ").replace(/([a-z0-9])([A-Z])/g, "$1 $2").replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2").trim().split(/\s+/).filter(Boolean);
}
function titleWord(word) {
  return /^[A-Z0-9]+$/.test(word) ? word : word.charAt(0).toUpperCase() + word.slice(1);
}
function generateEntityDictionary(entity, config = defaultDictionaryConfig) {
  const busEntity = entityToBusEntity(entity);
  const busAttributes = entity.attributes.map((attr, index) => attributeToBusAttribute(attr, index, entity.primaryKey));
  return {
    busEntity,
    busAttributes,
    dictionaryPlaceholders: {
      table: generateSysTable(busEntity, config),
      window: generateSysWindow(busEntity, config),
      fieldGroups: generateSysFieldGroups(busEntity.displayName, config)
    }
  };
}
var SEMANTIC_REFERENCE, PERSON_ROLE_COLUMN_NAMES, QUALIFIER_PREFIXES, PERSON_TABLES, defaultDictionaryConfig, BusEntitySchema, DictionaryGenerationConfigSchema;
var init_bus_entity_types = __esm(() => {
  init_zod();
  init_sys_dictionary_types();
  SEMANTIC_REFERENCE = {
    email: ReferenceType.EMAIL,
    url: ReferenceType.URL,
    phone: ReferenceType.PHONE,
    password: ReferenceType.PASSWORD,
    color: ReferenceType.COLOR
  };
  PERSON_ROLE_COLUMN_NAMES = new Set([
    "assigned_to",
    "author_id",
    "lab_manager_id",
    "manager_id",
    "owner_id",
    "pi_id",
    "remediation_owner",
    "remediation_owner_id",
    "user_id"
  ]);
  QUALIFIER_PREFIXES = ["parent_"];
  PERSON_TABLES = ["bus_user", "bus_staff", "bus_employee"];
  defaultDictionaryConfig = {
    defaultEntityType: "U",
    createdBy: "System",
    randomizeFieldOrder: true,
    includeFieldGroups: true,
    defaultAccessLevel: AccessLevel.ALL
  };
  BusEntitySchema = objectType({
    name: stringType(),
    tableName: stringType().regex(/^bus_/, "Table name must start with bus_"),
    originalName: stringType(),
    displayName: stringType(),
    description: stringType().optional(),
    attributes: arrayType(anyType()),
    primaryKey: stringType(),
    timestamps: booleanType()
  });
  DictionaryGenerationConfigSchema = objectType({
    defaultEntityType: stringType(),
    createdBy: stringType(),
    randomizeFieldOrder: booleanType(),
    includeFieldGroups: booleanType(),
    defaultAccessLevel: enumType(["S", "C", "O", "CO", "A"])
  });
});
// packages/core/src/types/entity.types.ts
var EntityAttributeSchema, EntitySchema;
var init_entity_types = __esm(() => {
  init_zod();
  EntityAttributeSchema = objectType({
    name: stringType(),
    type: enumType(["string", "integer", "decimal", "boolean", "date", "datetime", "text", "json"]),
    required: booleanType(),
    description: stringType().optional(),
    semanticType: enumType(["email", "url", "phone", "password", "color"]).optional(),
    unique: booleanType().optional(),
    default: anyType().optional(),
    maxLength: numberType().optional(),
    minLength: numberType().optional(),
    pattern: stringType().optional(),
    references: stringType().optional(),
    narrowedBy: arrayType(stringType()).optional()
  });
  EntitySchema = objectType({
    name: stringType(),
    tableName: stringType(),
    description: stringType().optional(),
    attributes: arrayType(EntityAttributeSchema),
    primaryKey: stringType(),
    timestamps: booleanType()
  });
});
// packages/core/src/types/index.ts
var init_types2 = __esm(() => {
  init_bus_entity_types();
  init_entity_types();
  init_sys_dictionary_types();
});
// packages/core/src/utils/table-naming.ts
function addBusPrefix(name) {
  if (name.startsWith(BUS_TABLE_PREFIX)) {
    return name;
  }
  if (name.startsWith(SYS_TABLE_PREFIX)) {
    return name;
  }
  return `${BUS_TABLE_PREFIX}${snakeCase(name)}`;
}
function addSysPrefix(name) {
  if (name.startsWith(SYS_TABLE_PREFIX)) {
    return name;
  }
  if (name.startsWith(BUS_TABLE_PREFIX)) {
    return name;
  }
  return `${SYS_TABLE_PREFIX}${snakeCase(name)}`;
}
function removeTablePrefix(name) {
  if (name.startsWith(BUS_TABLE_PREFIX)) {
    return name.slice(BUS_TABLE_PREFIX.length);
  }
  if (name.startsWith(SYS_TABLE_PREFIX)) {
    return name.slice(SYS_TABLE_PREFIX.length);
  }
  return name;
}
function getTablePrefix(name) {
  if (name.startsWith(SYS_TABLE_PREFIX)) {
    return "sys_";
  }
  if (name.startsWith(BUS_TABLE_PREFIX)) {
    return "bus_";
  }
  return null;
}
function tableNameToEntityName(tableName) {
  const withoutPrefix = removeTablePrefix(tableName);
  return pascalCase(withoutPrefix);
}
function tableNameToModelName(tableName) {
  return pascalCase(tableName.replace(/_/g, " ")).replace(/ /g, "");
}
function tableNameToControllerName(tableName) {
  return `${tableNameToModelName(tableName)}Controller`;
}
function tableNameToServiceName(tableName) {
  return `${tableNameToModelName(tableName)}Service`;
}
function tableNameToModuleName(tableName) {
  return `${tableNameToModelName(tableName)}Module`;
}
function tableNameToDtoName(tableName) {
  return `${tableNameToModelName(tableName)}Dto`;
}
function tableNameToRoutePath(tableName, includePrefix = false) {
  if (includePrefix) {
    const prefix = getTablePrefix(tableName);
    const name = removeTablePrefix(tableName);
    return prefix ? `/${prefix.replace("_", "")}/${name.replace(/_/g, "-")}` : `/${name.replace(/_/g, "-")}`;
  }
  return `/${removeTablePrefix(tableName).replace(/_/g, "-")}`;
}
function tableNameToEntitySetName(tableName) {
  const modelName = tableNameToModelName(tableName);
  if (modelName.endsWith("y")) {
    return modelName.slice(0, -1) + "ies";
  }
  if (modelName.endsWith("s") || modelName.endsWith("x") || modelName.endsWith("ch")) {
    return modelName + "es";
  }
  return modelName + "s";
}
function generatePrimaryKeyName(tableName) {
  return `${tableName}_id`;
}
function generateForeignKeyName(referencedTableName) {
  return `${referencedTableName}_id`;
}
var init_table_naming = __esm(() => {
  init_sys_dictionary_types();
});

// packages/core/src/utils/index.ts
var init_utils = __esm(() => {
  init_table_naming();
});

// language/browser/shims/child-process.ts
var exports_child_process = {};
__export(exports_child_process, {
  execSync: () => execSync,
  spawn: () => spawn
});
function refuse(name) {
  throw new Error(`child_process.${name} is not available in the browser build`);
}
var execSync = () => refuse("execSync"), spawn = () => refuse("spawn");
var init_child_process = () => {};

// node_modules/.bun/handlebars@4.7.9/node_modules/handlebars/dist/cjs/handlebars/utils.js
var require_utils = __commonJS(function(exports) {
  exports.__esModule = true;
  exports.extend = extend;
  exports.indexOf = indexOf;
  exports.escapeExpression = escapeExpression;
  exports.isEmpty = isEmpty;
  exports.createFrame = createFrame;
  exports.blockParams = blockParams;
  exports.appendContextPath = appendContextPath;
  var escape = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#x27;",
    "`": "&#x60;",
    "=": "&#x3D;"
  };
  var badChars = /[&<>"'`=]/g;
  var possible = /[&<>"'`=]/;
  function escapeChar(chr) {
    return escape[chr];
  }
  function extend(obj) {
    for (var i = 1;i < arguments.length; i++) {
      for (var key in arguments[i]) {
        if (Object.prototype.hasOwnProperty.call(arguments[i], key)) {
          obj[key] = arguments[i][key];
        }
      }
    }
    return obj;
  }
  var toString = Object.prototype.toString;
  exports.toString = toString;
  var isFunction = function isFunction(value) {
    return typeof value === "function";
  };
  if (isFunction(/x/)) {
    exports.isFunction = isFunction = function(value) {
      return typeof value === "function" && toString.call(value) === "[object Function]";
    };
  }
  exports.isFunction = isFunction;
  var isArray = Array.isArray || function(value) {
    return value && typeof value === "object" ? toString.call(value) === "[object Array]" : false;
  };
  exports.isArray = isArray;
  function indexOf(array, value) {
    for (var i = 0, len = array.length;i < len; i++) {
      if (array[i] === value) {
        return i;
      }
    }
    return -1;
  }
  function escapeExpression(string) {
    if (typeof string !== "string") {
      if (string && string.toHTML) {
        return string.toHTML();
      } else if (string == null) {
        return "";
      } else if (!string) {
        return string + "";
      }
      string = "" + string;
    }
    if (!possible.test(string)) {
      return string;
    }
    return string.replace(badChars, escapeChar);
  }
  function isEmpty(value) {
    if (!value && value !== 0) {
      return true;
    } else if (isArray(value) && value.length === 0) {
      return true;
    } else {
      return false;
    }
  }
  function createFrame(object) {
    var frame = extend({}, object);
    frame._parent = object;
    return frame;
  }
  function blockParams(params, ids) {
    params.path = ids;
    return params;
  }
  function appendContextPath(contextPath, id) {
    return (contextPath ? contextPath + "." : "") + id;
  }
});

// node_modules/.bun/handlebars@4.7.9/node_modules/handlebars/dist/cjs/handlebars/exception.js
var require_exception = __commonJS(function(exports, module) {
  exports.__esModule = true;
  var errorProps = ["description", "fileName", "lineNumber", "endLineNumber", "message", "name", "number", "stack"];
  function Exception(message, node) {
    var loc = node && node.loc, line = undefined, endLineNumber = undefined, column = undefined, endColumn = undefined;
    if (loc) {
      line = loc.start.line;
      endLineNumber = loc.end.line;
      column = loc.start.column;
      endColumn = loc.end.column;
      message += " - " + line + ":" + column;
    }
    var tmp = Error.prototype.constructor.call(this, message);
    for (var idx = 0;idx < errorProps.length; idx++) {
      this[errorProps[idx]] = tmp[errorProps[idx]];
    }
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, Exception);
    }
    try {
      if (loc) {
        this.lineNumber = line;
        this.endLineNumber = endLineNumber;
        if (Object.defineProperty) {
          Object.defineProperty(this, "column", {
            value: column,
            enumerable: true
          });
          Object.defineProperty(this, "endColumn", {
            value: endColumn,
            enumerable: true
          });
        } else {
          this.column = column;
          this.endColumn = endColumn;
        }
      }
    } catch (nop) {}
  }
  Exception.prototype = new Error;
  exports.default = Exception;
  module.exports = exports["default"];
});

// node_modules/.bun/handlebars@4.7.9/node_modules/handlebars/dist/cjs/handlebars/helpers/block-helper-missing.js
var require_block_helper_missing = __commonJS(function(exports, module) {
  exports.__esModule = true;
  var _utils = require_utils();
  exports.default = function(instance) {
    instance.registerHelper("blockHelperMissing", function(context, options) {
      var inverse = options.inverse, fn = options.fn;
      if (context === true) {
        return fn(this);
      } else if (context === false || context == null) {
        return inverse(this);
      } else if (_utils.isArray(context)) {
        if (context.length > 0) {
          if (options.ids) {
            options.ids = [options.name];
          }
          return instance.helpers.each(context, options);
        } else {
          return inverse(this);
        }
      } else {
        if (options.data && options.ids) {
          var data = _utils.createFrame(options.data);
          data.contextPath = _utils.appendContextPath(options.data.contextPath, options.name);
          options = { data };
        }
        return fn(context, options);
      }
    });
  };
  module.exports = exports["default"];
});

// node_modules/.bun/handlebars@4.7.9/node_modules/handlebars/dist/cjs/handlebars/helpers/each.js
var require_each = __commonJS(function(exports, module) {
  exports.__esModule = true;
  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
  }
  var _utils = require_utils();
  var _exception = require_exception();
  var _exception2 = _interopRequireDefault(_exception);
  exports.default = function(instance) {
    instance.registerHelper("each", function(context, options) {
      if (!options) {
        throw new _exception2["default"]("Must pass iterator to #each");
      }
      var { fn, inverse } = options, i = 0, ret = "", data = undefined, contextPath = undefined;
      if (options.data && options.ids) {
        contextPath = _utils.appendContextPath(options.data.contextPath, options.ids[0]) + ".";
      }
      if (_utils.isFunction(context)) {
        context = context.call(this);
      }
      if (options.data) {
        data = _utils.createFrame(options.data);
      }
      function execIteration(field, index, last) {
        if (data) {
          data.key = field;
          data.index = index;
          data.first = index === 0;
          data.last = !!last;
          if (contextPath) {
            data.contextPath = contextPath + field;
          }
        }
        ret = ret + fn(context[field], {
          data,
          blockParams: _utils.blockParams([context[field], field], [contextPath + field, null])
        });
      }
      if (context && typeof context === "object") {
        if (_utils.isArray(context)) {
          for (var j = context.length;i < j; i++) {
            if (i in context) {
              execIteration(i, i, i === context.length - 1);
            }
          }
        } else if (typeof Symbol === "function" && context[Symbol.iterator]) {
          var newContext = [];
          var iterator = context[Symbol.iterator]();
          for (var it = iterator.next();!it.done; it = iterator.next()) {
            newContext.push(it.value);
          }
          context = newContext;
          for (var j = context.length;i < j; i++) {
            execIteration(i, i, i === context.length - 1);
          }
        } else {
          (function() {
            var priorKey = undefined;
            Object.keys(context).forEach(function(key) {
              if (priorKey !== undefined) {
                execIteration(priorKey, i - 1);
              }
              priorKey = key;
              i++;
            });
            if (priorKey !== undefined) {
              execIteration(priorKey, i - 1, true);
            }
          })();
        }
      }
      if (i === 0) {
        ret = inverse(this);
      }
      return ret;
    });
  };
  module.exports = exports["default"];
});

// node_modules/.bun/handlebars@4.7.9/node_modules/handlebars/dist/cjs/handlebars/helpers/helper-missing.js
var require_helper_missing = __commonJS(function(exports, module) {
  exports.__esModule = true;
  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
  }
  var _exception = require_exception();
  var _exception2 = _interopRequireDefault(_exception);
  exports.default = function(instance) {
    instance.registerHelper("helperMissing", function() {
      if (arguments.length === 1) {
        return;
      } else {
        throw new _exception2["default"]('Missing helper: "' + arguments[arguments.length - 1].name + '"');
      }
    });
  };
  module.exports = exports["default"];
});

// node_modules/.bun/handlebars@4.7.9/node_modules/handlebars/dist/cjs/handlebars/helpers/if.js
var require_if = __commonJS(function(exports, module) {
  exports.__esModule = true;
  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
  }
  var _utils = require_utils();
  var _exception = require_exception();
  var _exception2 = _interopRequireDefault(_exception);
  exports.default = function(instance) {
    instance.registerHelper("if", function(conditional, options) {
      if (arguments.length != 2) {
        throw new _exception2["default"]("#if requires exactly one argument");
      }
      if (_utils.isFunction(conditional)) {
        conditional = conditional.call(this);
      }
      if (!options.hash.includeZero && !conditional || _utils.isEmpty(conditional)) {
        return options.inverse(this);
      } else {
        return options.fn(this);
      }
    });
    instance.registerHelper("unless", function(conditional, options) {
      if (arguments.length != 2) {
        throw new _exception2["default"]("#unless requires exactly one argument");
      }
      return instance.helpers["if"].call(this, conditional, {
        fn: options.inverse,
        inverse: options.fn,
        hash: options.hash
      });
    });
  };
  module.exports = exports["default"];
});

// node_modules/.bun/handlebars@4.7.9/node_modules/handlebars/dist/cjs/handlebars/helpers/log.js
var require_log = __commonJS(function(exports, module) {
  exports.__esModule = true;
  exports.default = function(instance) {
    instance.registerHelper("log", function() {
      var args = [undefined], options = arguments[arguments.length - 1];
      for (var i = 0;i < arguments.length - 1; i++) {
        args.push(arguments[i]);
      }
      var level = 1;
      if (options.hash.level != null) {
        level = options.hash.level;
      } else if (options.data && options.data.level != null) {
        level = options.data.level;
      }
      args[0] = level;
      instance.log.apply(instance, args);
    });
  };
  module.exports = exports["default"];
});

// node_modules/.bun/handlebars@4.7.9/node_modules/handlebars/dist/cjs/handlebars/helpers/lookup.js
var require_lookup = __commonJS(function(exports, module) {
  exports.__esModule = true;
  exports.default = function(instance) {
    instance.registerHelper("lookup", function(obj, field, options) {
      if (!obj) {
        return obj;
      }
      return options.lookupProperty(obj, field);
    });
  };
  module.exports = exports["default"];
});

// node_modules/.bun/handlebars@4.7.9/node_modules/handlebars/dist/cjs/handlebars/helpers/with.js
var require_with = __commonJS(function(exports, module) {
  exports.__esModule = true;
  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
  }
  var _utils = require_utils();
  var _exception = require_exception();
  var _exception2 = _interopRequireDefault(_exception);
  exports.default = function(instance) {
    instance.registerHelper("with", function(context, options) {
      if (arguments.length != 2) {
        throw new _exception2["default"]("#with requires exactly one argument");
      }
      if (_utils.isFunction(context)) {
        context = context.call(this);
      }
      var fn = options.fn;
      if (!_utils.isEmpty(context)) {
        var data = options.data;
        if (options.data && options.ids) {
          data = _utils.createFrame(options.data);
          data.contextPath = _utils.appendContextPath(options.data.contextPath, options.ids[0]);
        }
        return fn(context, {
          data,
          blockParams: _utils.blockParams([context], [data && data.contextPath])
        });
      } else {
        return options.inverse(this);
      }
    });
  };
  module.exports = exports["default"];
});

// node_modules/.bun/handlebars@4.7.9/node_modules/handlebars/dist/cjs/handlebars/helpers.js
var require_helpers = __commonJS(function(exports) {
  exports.__esModule = true;
  exports.registerDefaultHelpers = registerDefaultHelpers;
  exports.moveHelperToHooks = moveHelperToHooks;
  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
  }
  var _helpersBlockHelperMissing = require_block_helper_missing();
  var _helpersBlockHelperMissing2 = _interopRequireDefault(_helpersBlockHelperMissing);
  var _helpersEach = require_each();
  var _helpersEach2 = _interopRequireDefault(_helpersEach);
  var _helpersHelperMissing = require_helper_missing();
  var _helpersHelperMissing2 = _interopRequireDefault(_helpersHelperMissing);
  var _helpersIf = require_if();
  var _helpersIf2 = _interopRequireDefault(_helpersIf);
  var _helpersLog = require_log();
  var _helpersLog2 = _interopRequireDefault(_helpersLog);
  var _helpersLookup = require_lookup();
  var _helpersLookup2 = _interopRequireDefault(_helpersLookup);
  var _helpersWith = require_with();
  var _helpersWith2 = _interopRequireDefault(_helpersWith);
  function registerDefaultHelpers(instance) {
    _helpersBlockHelperMissing2["default"](instance);
    _helpersEach2["default"](instance);
    _helpersHelperMissing2["default"](instance);
    _helpersIf2["default"](instance);
    _helpersLog2["default"](instance);
    _helpersLookup2["default"](instance);
    _helpersWith2["default"](instance);
  }
  function moveHelperToHooks(instance, helperName, keepHelper) {
    if (instance.helpers[helperName]) {
      instance.hooks[helperName] = instance.helpers[helperName];
      if (!keepHelper) {
        instance.helpers[helperName] = undefined;
      }
    }
  }
});

// node_modules/.bun/handlebars@4.7.9/node_modules/handlebars/dist/cjs/handlebars/decorators/inline.js
var require_inline = __commonJS(function(exports, module) {
  exports.__esModule = true;
  var _utils = require_utils();
  exports.default = function(instance) {
    instance.registerDecorator("inline", function(fn, props, container, options) {
      var ret = fn;
      if (!props.partials) {
        props.partials = {};
        ret = function(context, options) {
          var original = container.partials;
          container.partials = _utils.extend({}, original, props.partials);
          var ret = fn(context, options);
          container.partials = original;
          return ret;
        };
      }
      props.partials[options.args[0]] = options.fn;
      return ret;
    });
  };
  module.exports = exports["default"];
});

// node_modules/.bun/handlebars@4.7.9/node_modules/handlebars/dist/cjs/handlebars/decorators.js
var require_decorators = __commonJS(function(exports) {
  exports.__esModule = true;
  exports.registerDefaultDecorators = registerDefaultDecorators;
  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
  }
  var _decoratorsInline = require_inline();
  var _decoratorsInline2 = _interopRequireDefault(_decoratorsInline);
  function registerDefaultDecorators(instance) {
    _decoratorsInline2["default"](instance);
  }
});

// node_modules/.bun/handlebars@4.7.9/node_modules/handlebars/dist/cjs/handlebars/logger.js
var require_logger = __commonJS(function(exports, module) {
  exports.__esModule = true;
  var _utils = require_utils();
  var logger = {
    methodMap: ["debug", "info", "warn", "error"],
    level: "info",
    lookupLevel: function lookupLevel(level) {
      if (typeof level === "string") {
        var levelMap = _utils.indexOf(logger.methodMap, level.toLowerCase());
        if (levelMap >= 0) {
          level = levelMap;
        } else {
          level = parseInt(level, 10);
        }
      }
      return level;
    },
    log: function log(level) {
      level = logger.lookupLevel(level);
      if (typeof console !== "undefined" && logger.lookupLevel(logger.level) <= level) {
        var method = logger.methodMap[level];
        if (!console[method]) {
          method = "log";
        }
        for (var _len = arguments.length, message = Array(_len > 1 ? _len - 1 : 0), _key = 1;_key < _len; _key++) {
          message[_key - 1] = arguments[_key];
        }
        console[method].apply(console, message);
      }
    }
  };
  exports.default = logger;
  module.exports = exports["default"];
});

// node_modules/.bun/handlebars@4.7.9/node_modules/handlebars/dist/cjs/handlebars/internal/proto-access.js
var require_proto_access = __commonJS(function(exports) {
  exports.__esModule = true;
  exports.createProtoAccessControl = createProtoAccessControl;
  exports.resultIsAllowed = resultIsAllowed;
  exports.resetLoggedProperties = resetLoggedProperties;
  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
  }
  var _utils = require_utils();
  var _logger = require_logger();
  var _logger2 = _interopRequireDefault(_logger);
  var loggedProperties = Object.create(null);
  function createProtoAccessControl(runtimeOptions) {
    var propertyWhiteList = Object.create(null);
    propertyWhiteList["__proto__"] = false;
    _utils.extend(propertyWhiteList, runtimeOptions.allowedProtoProperties);
    var methodWhiteList = Object.create(null);
    methodWhiteList["constructor"] = false;
    methodWhiteList["__defineGetter__"] = false;
    methodWhiteList["__defineSetter__"] = false;
    methodWhiteList["__lookupGetter__"] = false;
    methodWhiteList["__lookupSetter__"] = false;
    _utils.extend(methodWhiteList, runtimeOptions.allowedProtoMethods);
    return {
      properties: {
        whitelist: propertyWhiteList,
        defaultValue: runtimeOptions.allowProtoPropertiesByDefault
      },
      methods: {
        whitelist: methodWhiteList,
        defaultValue: runtimeOptions.allowProtoMethodsByDefault
      }
    };
  }
  function resultIsAllowed(result, protoAccessControl, propertyName) {
    if (typeof result === "function") {
      return checkWhiteList(protoAccessControl.methods, propertyName);
    } else {
      return checkWhiteList(protoAccessControl.properties, propertyName);
    }
  }
  function checkWhiteList(protoAccessControlForType, propertyName) {
    if (protoAccessControlForType.whitelist[propertyName] !== undefined) {
      return protoAccessControlForType.whitelist[propertyName] === true;
    }
    if (protoAccessControlForType.defaultValue !== undefined) {
      return protoAccessControlForType.defaultValue;
    }
    logUnexpecedPropertyAccessOnce(propertyName);
    return false;
  }
  function logUnexpecedPropertyAccessOnce(propertyName) {
    if (loggedProperties[propertyName] !== true) {
      loggedProperties[propertyName] = true;
      _logger2["default"].log("error", 'Handlebars: Access has been denied to resolve the property "' + propertyName + `" because it is not an "own property" of its parent.
` + `You can add a runtime option to disable the check or this warning:
` + "See https://handlebarsjs.com/api-reference/runtime-options.html#options-to-control-prototype-access for details");
    }
  }
  function resetLoggedProperties() {
    Object.keys(loggedProperties).forEach(function(propertyName) {
      delete loggedProperties[propertyName];
    });
  }
});

// node_modules/.bun/handlebars@4.7.9/node_modules/handlebars/dist/cjs/handlebars/base.js
var require_base = __commonJS(function(exports) {
  exports.__esModule = true;
  exports.HandlebarsEnvironment = HandlebarsEnvironment;
  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
  }
  var _utils = require_utils();
  var _exception = require_exception();
  var _exception2 = _interopRequireDefault(_exception);
  var _helpers = require_helpers();
  var _decorators = require_decorators();
  var _logger = require_logger();
  var _logger2 = _interopRequireDefault(_logger);
  var _internalProtoAccess = require_proto_access();
  var VERSION = "4.7.9";
  exports.VERSION = VERSION;
  var COMPILER_REVISION = 8;
  exports.COMPILER_REVISION = COMPILER_REVISION;
  var LAST_COMPATIBLE_COMPILER_REVISION = 7;
  exports.LAST_COMPATIBLE_COMPILER_REVISION = LAST_COMPATIBLE_COMPILER_REVISION;
  var REVISION_CHANGES = {
    1: "<= 1.0.rc.2",
    2: "== 1.0.0-rc.3",
    3: "== 1.0.0-rc.4",
    4: "== 1.x.x",
    5: "== 2.0.0-alpha.x",
    6: ">= 2.0.0-beta.1",
    7: ">= 4.0.0 <4.3.0",
    8: ">= 4.3.0"
  };
  exports.REVISION_CHANGES = REVISION_CHANGES;
  var objectType = "[object Object]";
  function HandlebarsEnvironment(helpers, partials, decorators) {
    this.helpers = helpers || {};
    this.partials = partials || {};
    this.decorators = decorators || {};
    _helpers.registerDefaultHelpers(this);
    _decorators.registerDefaultDecorators(this);
  }
  HandlebarsEnvironment.prototype = {
    constructor: HandlebarsEnvironment,
    logger: _logger2["default"],
    log: _logger2["default"].log,
    registerHelper: function registerHelper(name, fn) {
      if (_utils.toString.call(name) === objectType) {
        if (fn) {
          throw new _exception2["default"]("Arg not supported with multiple helpers");
        }
        _utils.extend(this.helpers, name);
      } else {
        this.helpers[name] = fn;
      }
    },
    unregisterHelper: function unregisterHelper(name) {
      delete this.helpers[name];
    },
    registerPartial: function registerPartial(name, partial) {
      if (_utils.toString.call(name) === objectType) {
        _utils.extend(this.partials, name);
      } else {
        if (typeof partial === "undefined") {
          throw new _exception2["default"]('Attempting to register a partial called "' + name + '" as undefined');
        }
        this.partials[name] = partial;
      }
    },
    unregisterPartial: function unregisterPartial(name) {
      delete this.partials[name];
    },
    registerDecorator: function registerDecorator(name, fn) {
      if (_utils.toString.call(name) === objectType) {
        if (fn) {
          throw new _exception2["default"]("Arg not supported with multiple decorators");
        }
        _utils.extend(this.decorators, name);
      } else {
        this.decorators[name] = fn;
      }
    },
    unregisterDecorator: function unregisterDecorator(name) {
      delete this.decorators[name];
    },
    resetLoggedPropertyAccesses: function resetLoggedPropertyAccesses() {
      _internalProtoAccess.resetLoggedProperties();
    }
  };
  var log = _logger2["default"].log;
  exports.log = log;
  exports.createFrame = _utils.createFrame;
  exports.logger = _logger2["default"];
});

// node_modules/.bun/handlebars@4.7.9/node_modules/handlebars/dist/cjs/handlebars/safe-string.js
var require_safe_string = __commonJS(function(exports, module) {
  exports.__esModule = true;
  function SafeString(string) {
    this.string = string;
  }
  SafeString.prototype.toString = SafeString.prototype.toHTML = function() {
    return "" + this.string;
  };
  exports.default = SafeString;
  module.exports = exports["default"];
});

// node_modules/.bun/handlebars@4.7.9/node_modules/handlebars/dist/cjs/handlebars/internal/wrapHelper.js
var require_wrapHelper = __commonJS(function(exports) {
  exports.__esModule = true;
  exports.wrapHelper = wrapHelper;
  function wrapHelper(helper, transformOptionsFn) {
    if (typeof helper !== "function") {
      return helper;
    }
    var wrapper = function wrapper() {
      var options = arguments[arguments.length - 1];
      arguments[arguments.length - 1] = transformOptionsFn(options);
      return helper.apply(this, arguments);
    };
    return wrapper;
  }
});

// node_modules/.bun/handlebars@4.7.9/node_modules/handlebars/dist/cjs/handlebars/runtime.js
var require_runtime = __commonJS(function(exports) {
  exports.__esModule = true;
  exports.checkRevision = checkRevision;
  exports.template = template;
  exports.wrapProgram = wrapProgram;
  exports.resolvePartial = resolvePartial;
  exports.invokePartial = invokePartial;
  exports.noop = noop;
  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
  }
  function _interopRequireWildcard(obj) {
    if (obj && obj.__esModule) {
      return obj;
    } else {
      var newObj = {};
      if (obj != null) {
        for (var key in obj) {
          if (Object.prototype.hasOwnProperty.call(obj, key))
            newObj[key] = obj[key];
        }
      }
      newObj["default"] = obj;
      return newObj;
    }
  }
  var _utils = require_utils();
  var Utils = _interopRequireWildcard(_utils);
  var _exception = require_exception();
  var _exception2 = _interopRequireDefault(_exception);
  var _base = require_base();
  var _helpers = require_helpers();
  var _internalWrapHelper = require_wrapHelper();
  var _internalProtoAccess = require_proto_access();
  function checkRevision(compilerInfo) {
    var compilerRevision = compilerInfo && compilerInfo[0] || 1, currentRevision = _base.COMPILER_REVISION;
    if (compilerRevision >= _base.LAST_COMPATIBLE_COMPILER_REVISION && compilerRevision <= _base.COMPILER_REVISION) {
      return;
    }
    if (compilerRevision < _base.LAST_COMPATIBLE_COMPILER_REVISION) {
      var runtimeVersions = _base.REVISION_CHANGES[currentRevision], compilerVersions = _base.REVISION_CHANGES[compilerRevision];
      throw new _exception2["default"]("Template was precompiled with an older version of Handlebars than the current runtime. " + "Please update your precompiler to a newer version (" + runtimeVersions + ") or downgrade your runtime to an older version (" + compilerVersions + ").");
    } else {
      throw new _exception2["default"]("Template was precompiled with a newer version of Handlebars than the current runtime. " + "Please update your runtime to a newer version (" + compilerInfo[1] + ").");
    }
  }
  function template(templateSpec, env) {
    if (!env) {
      throw new _exception2["default"]("No environment passed to template");
    }
    if (!templateSpec || !templateSpec.main) {
      throw new _exception2["default"]("Unknown template object: " + typeof templateSpec);
    }
    templateSpec.main.decorator = templateSpec.main_d;
    env.VM.checkRevision(templateSpec.compiler);
    var templateWasPrecompiledWithCompilerV7 = templateSpec.compiler && templateSpec.compiler[0] === 7;
    function invokePartialWrapper(partial, context, options) {
      if (options.hash) {
        context = Utils.extend({}, context, options.hash);
        if (options.ids) {
          options.ids[0] = true;
        }
      }
      partial = env.VM.resolvePartial.call(this, partial, context, options);
      options.hooks = this.hooks;
      options.protoAccessControl = this.protoAccessControl;
      var result = env.VM.invokePartial.call(this, partial, context, options);
      if (result == null && env.compile) {
        options.partials[options.name] = env.compile(partial, templateSpec.compilerOptions, env);
        result = options.partials[options.name](context, options);
      }
      if (result != null) {
        if (options.indent) {
          var lines = result.split(`
`);
          for (var i = 0, l = lines.length;i < l; i++) {
            if (!lines[i] && i + 1 === l) {
              break;
            }
            lines[i] = options.indent + lines[i];
          }
          result = lines.join(`
`);
        }
        return result;
      } else {
        throw new _exception2["default"]("The partial " + options.name + " could not be compiled when running in runtime-only mode");
      }
    }
    var container = {
      strict: function strict(obj, name, loc) {
        if (!obj || !(name in obj)) {
          throw new _exception2["default"]('"' + name + '" not defined in ' + obj, {
            loc
          });
        }
        return container.lookupProperty(obj, name);
      },
      lookupProperty: function lookupProperty(parent, propertyName) {
        var result = parent[propertyName];
        if (result == null) {
          return result;
        }
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return result;
        }
        if (_internalProtoAccess.resultIsAllowed(result, container.protoAccessControl, propertyName)) {
          return result;
        }
        return;
      },
      lookup: function lookup(depths, name) {
        var len = depths.length;
        for (var i = 0;i < len; i++) {
          var result = depths[i] && container.lookupProperty(depths[i], name);
          if (result != null) {
            return result;
          }
        }
      },
      lambda: function lambda(current, context) {
        return typeof current === "function" ? current.call(context) : current;
      },
      escapeExpression: Utils.escapeExpression,
      invokePartial: invokePartialWrapper,
      fn: function fn(i) {
        var ret = templateSpec[i];
        ret.decorator = templateSpec[i + "_d"];
        return ret;
      },
      programs: [],
      program: function program(i, data, declaredBlockParams, blockParams, depths) {
        var programWrapper = this.programs[i], fn = this.fn(i);
        if (data || depths || blockParams || declaredBlockParams) {
          programWrapper = wrapProgram(this, i, fn, data, declaredBlockParams, blockParams, depths);
        } else if (!programWrapper) {
          programWrapper = this.programs[i] = wrapProgram(this, i, fn);
        }
        return programWrapper;
      },
      data: function data(value, depth) {
        while (value && depth--) {
          value = value._parent;
        }
        return value;
      },
      mergeIfNeeded: function mergeIfNeeded(param, common) {
        var obj = param || common;
        if (param && common && param !== common) {
          obj = Utils.extend({}, common, param);
        }
        return obj;
      },
      nullContext: Object.seal({}),
      noop: env.VM.noop,
      compilerInfo: templateSpec.compiler
    };
    function ret(context) {
      var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];
      var data = options.data;
      ret._setup(options);
      if (!options.partial && templateSpec.useData) {
        data = initData(context, data);
      }
      var depths = undefined, blockParams = templateSpec.useBlockParams ? [] : undefined;
      if (templateSpec.useDepths) {
        if (options.depths) {
          depths = context != options.depths[0] ? [context].concat(options.depths) : options.depths;
        } else {
          depths = [context];
        }
      }
      function main(context) {
        return "" + templateSpec.main(container, context, container.helpers, container.partials, data, blockParams, depths);
      }
      main = executeDecorators(templateSpec.main, main, container, options.depths || [], data, blockParams);
      return main(context, options);
    }
    ret.isTop = true;
    ret._setup = function(options) {
      if (!options.partial) {
        var mergedHelpers = {};
        addHelpers(mergedHelpers, env.helpers, container);
        addHelpers(mergedHelpers, options.helpers, container);
        container.helpers = mergedHelpers;
        if (templateSpec.usePartial) {
          container.partials = container.mergeIfNeeded(options.partials, env.partials);
        }
        if (templateSpec.usePartial || templateSpec.useDecorators) {
          container.decorators = Utils.extend({}, env.decorators, options.decorators);
        }
        container.hooks = {};
        container.protoAccessControl = _internalProtoAccess.createProtoAccessControl(options);
        var keepHelperInHelpers = options.allowCallsToHelperMissing || templateWasPrecompiledWithCompilerV7;
        _helpers.moveHelperToHooks(container, "helperMissing", keepHelperInHelpers);
        _helpers.moveHelperToHooks(container, "blockHelperMissing", keepHelperInHelpers);
      } else {
        container.protoAccessControl = options.protoAccessControl;
        container.helpers = options.helpers;
        container.partials = options.partials;
        container.decorators = options.decorators;
        container.hooks = options.hooks;
      }
    };
    ret._child = function(i, data, blockParams, depths) {
      if (templateSpec.useBlockParams && !blockParams) {
        throw new _exception2["default"]("must pass block params");
      }
      if (templateSpec.useDepths && !depths) {
        throw new _exception2["default"]("must pass parent depths");
      }
      return wrapProgram(container, i, templateSpec[i], data, 0, blockParams, depths);
    };
    return ret;
  }
  function wrapProgram(container, i, fn, data, declaredBlockParams, blockParams, depths) {
    function prog(context) {
      var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];
      var currentDepths = depths;
      if (depths && context != depths[0] && !(context === container.nullContext && depths[0] === null)) {
        currentDepths = [context].concat(depths);
      }
      return fn(container, context, container.helpers, container.partials, options.data || data, blockParams && [options.blockParams].concat(blockParams), currentDepths);
    }
    prog = executeDecorators(fn, prog, container, depths, data, blockParams);
    prog.program = i;
    prog.depth = depths ? depths.length : 0;
    prog.blockParams = declaredBlockParams || 0;
    return prog;
  }
  function resolvePartial(partial, context, options) {
    if (!partial) {
      if (options.name === "@partial-block") {
        partial = lookupOwnProperty(options.data, "partial-block");
      } else {
        partial = lookupOwnProperty(options.partials, options.name);
      }
    } else if (!partial.call && !options.name) {
      options.name = partial;
      partial = lookupOwnProperty(options.partials, partial);
    }
    return partial;
  }
  function invokePartial(partial, context, options) {
    var currentPartialBlock = lookupOwnProperty(options.data, "partial-block");
    options.partial = true;
    if (options.ids) {
      options.data.contextPath = options.ids[0] || options.data.contextPath;
    }
    var partialBlock = undefined;
    if (options.fn && options.fn !== noop) {
      (function() {
        options.data = _base.createFrame(options.data);
        var fn = options.fn;
        partialBlock = options.data["partial-block"] = function partialBlockWrapper(context) {
          var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];
          options.data = _base.createFrame(options.data);
          options.data["partial-block"] = currentPartialBlock;
          return fn(context, options);
        };
        if (fn.partials) {
          options.partials = Utils.extend({}, options.partials, fn.partials);
        }
      })();
    }
    if (partial === undefined && partialBlock) {
      partial = partialBlock;
    }
    if (partial === undefined) {
      throw new _exception2["default"]("The partial " + options.name + " could not be found");
    } else if (partial instanceof Function) {
      return partial(context, options);
    }
  }
  function noop() {
    return "";
  }
  function lookupOwnProperty(obj, name) {
    if (obj && Object.prototype.hasOwnProperty.call(obj, name)) {
      return obj[name];
    }
  }
  function initData(context, data) {
    if (!data || !("root" in data)) {
      data = data ? _base.createFrame(data) : {};
      data.root = context;
    }
    return data;
  }
  function executeDecorators(fn, prog, container, depths, data, blockParams) {
    if (fn.decorator) {
      var props = {};
      prog = fn.decorator(prog, props, container, depths && depths[0], data, blockParams, depths);
      Utils.extend(prog, props);
    }
    return prog;
  }
  function addHelpers(mergedHelpers, helpers, container) {
    if (!helpers)
      return;
    Object.keys(helpers).forEach(function(helperName) {
      var helper = helpers[helperName];
      mergedHelpers[helperName] = passLookupPropertyOption(helper, container);
    });
  }
  function passLookupPropertyOption(helper, container) {
    var lookupProperty = container.lookupProperty;
    return _internalWrapHelper.wrapHelper(helper, function(options) {
      options.lookupProperty = lookupProperty;
      return options;
    });
  }
});

// node_modules/.bun/handlebars@4.7.9/node_modules/handlebars/dist/cjs/handlebars/no-conflict.js
var require_no_conflict = __commonJS(function(exports, module) {
  exports.__esModule = true;
  exports.default = function(Handlebars) {
    (function() {
      if (typeof globalThis === "object")
        return;
      Object.prototype.__defineGetter__("__magic__", function() {
        return this;
      });
      __magic__.globalThis = __magic__;
      delete Object.prototype.__magic__;
    })();
    var $Handlebars = globalThis.Handlebars;
    Handlebars.noConflict = function() {
      if (globalThis.Handlebars === Handlebars) {
        globalThis.Handlebars = $Handlebars;
      }
      return Handlebars;
    };
  };
  module.exports = exports["default"];
});

// node_modules/.bun/handlebars@4.7.9/node_modules/handlebars/dist/cjs/handlebars.runtime.js
var require_handlebars_runtime = __commonJS(function(exports, module) {
  exports.__esModule = true;
  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
  }
  function _interopRequireWildcard(obj) {
    if (obj && obj.__esModule) {
      return obj;
    } else {
      var newObj = {};
      if (obj != null) {
        for (var key in obj) {
          if (Object.prototype.hasOwnProperty.call(obj, key))
            newObj[key] = obj[key];
        }
      }
      newObj["default"] = obj;
      return newObj;
    }
  }
  var _handlebarsBase = require_base();
  var base = _interopRequireWildcard(_handlebarsBase);
  var _handlebarsSafeString = require_safe_string();
  var _handlebarsSafeString2 = _interopRequireDefault(_handlebarsSafeString);
  var _handlebarsException = require_exception();
  var _handlebarsException2 = _interopRequireDefault(_handlebarsException);
  var _handlebarsUtils = require_utils();
  var Utils = _interopRequireWildcard(_handlebarsUtils);
  var _handlebarsRuntime = require_runtime();
  var runtime = _interopRequireWildcard(_handlebarsRuntime);
  var _handlebarsNoConflict = require_no_conflict();
  var _handlebarsNoConflict2 = _interopRequireDefault(_handlebarsNoConflict);
  function create() {
    var hb = new base.HandlebarsEnvironment;
    Utils.extend(hb, base);
    hb.SafeString = _handlebarsSafeString2["default"];
    hb.Exception = _handlebarsException2["default"];
    hb.Utils = Utils;
    hb.escapeExpression = Utils.escapeExpression;
    hb.VM = runtime;
    hb.template = function(spec) {
      return runtime.template(spec, hb);
    };
    return hb;
  }
  var inst = create();
  inst.create = create;
  _handlebarsNoConflict2["default"](inst);
  inst["default"] = inst;
  exports.default = inst;
  module.exports = exports["default"];
});

// node_modules/.bun/handlebars@4.7.9/node_modules/handlebars/dist/cjs/handlebars/compiler/ast.js
var require_ast = __commonJS(function(exports, module) {
  exports.__esModule = true;
  var AST = {
    helpers: {
      helperExpression: function helperExpression(node) {
        return node.type === "SubExpression" || (node.type === "MustacheStatement" || node.type === "BlockStatement") && !!(node.params && node.params.length || node.hash);
      },
      scopedId: function scopedId(path) {
        return /^\.|this\b/.test(path.original);
      },
      simpleId: function simpleId(path) {
        return path.parts.length === 1 && !AST.helpers.scopedId(path) && !path.depth;
      }
    }
  };
  exports.default = AST;
  module.exports = exports["default"];
});

// node_modules/.bun/handlebars@4.7.9/node_modules/handlebars/dist/cjs/handlebars/compiler/parser.js
var require_parser = __commonJS(function(exports, module) {
  exports.__esModule = true;
  var handlebars = function() {
    var parser = {
      trace: function trace() {},
      yy: {},
      symbols_: { error: 2, root: 3, program: 4, EOF: 5, program_repetition0: 6, statement: 7, mustache: 8, block: 9, rawBlock: 10, partial: 11, partialBlock: 12, content: 13, COMMENT: 14, CONTENT: 15, openRawBlock: 16, rawBlock_repetition0: 17, END_RAW_BLOCK: 18, OPEN_RAW_BLOCK: 19, helperName: 20, openRawBlock_repetition0: 21, openRawBlock_option0: 22, CLOSE_RAW_BLOCK: 23, openBlock: 24, block_option0: 25, closeBlock: 26, openInverse: 27, block_option1: 28, OPEN_BLOCK: 29, openBlock_repetition0: 30, openBlock_option0: 31, openBlock_option1: 32, CLOSE: 33, OPEN_INVERSE: 34, openInverse_repetition0: 35, openInverse_option0: 36, openInverse_option1: 37, openInverseChain: 38, OPEN_INVERSE_CHAIN: 39, openInverseChain_repetition0: 40, openInverseChain_option0: 41, openInverseChain_option1: 42, inverseAndProgram: 43, INVERSE: 44, inverseChain: 45, inverseChain_option0: 46, OPEN_ENDBLOCK: 47, OPEN: 48, mustache_repetition0: 49, mustache_option0: 50, OPEN_UNESCAPED: 51, mustache_repetition1: 52, mustache_option1: 53, CLOSE_UNESCAPED: 54, OPEN_PARTIAL: 55, partialName: 56, partial_repetition0: 57, partial_option0: 58, openPartialBlock: 59, OPEN_PARTIAL_BLOCK: 60, openPartialBlock_repetition0: 61, openPartialBlock_option0: 62, param: 63, sexpr: 64, OPEN_SEXPR: 65, sexpr_repetition0: 66, sexpr_option0: 67, CLOSE_SEXPR: 68, hash: 69, hash_repetition_plus0: 70, hashSegment: 71, ID: 72, EQUALS: 73, blockParams: 74, OPEN_BLOCK_PARAMS: 75, blockParams_repetition_plus0: 76, CLOSE_BLOCK_PARAMS: 77, path: 78, dataName: 79, STRING: 80, NUMBER: 81, BOOLEAN: 82, UNDEFINED: 83, NULL: 84, DATA: 85, pathSegments: 86, SEP: 87, $accept: 0, $end: 1 },
      terminals_: { 2: "error", 5: "EOF", 14: "COMMENT", 15: "CONTENT", 18: "END_RAW_BLOCK", 19: "OPEN_RAW_BLOCK", 23: "CLOSE_RAW_BLOCK", 29: "OPEN_BLOCK", 33: "CLOSE", 34: "OPEN_INVERSE", 39: "OPEN_INVERSE_CHAIN", 44: "INVERSE", 47: "OPEN_ENDBLOCK", 48: "OPEN", 51: "OPEN_UNESCAPED", 54: "CLOSE_UNESCAPED", 55: "OPEN_PARTIAL", 60: "OPEN_PARTIAL_BLOCK", 65: "OPEN_SEXPR", 68: "CLOSE_SEXPR", 72: "ID", 73: "EQUALS", 75: "OPEN_BLOCK_PARAMS", 77: "CLOSE_BLOCK_PARAMS", 80: "STRING", 81: "NUMBER", 82: "BOOLEAN", 83: "UNDEFINED", 84: "NULL", 85: "DATA", 87: "SEP" },
      productions_: [0, [3, 2], [4, 1], [7, 1], [7, 1], [7, 1], [7, 1], [7, 1], [7, 1], [7, 1], [13, 1], [10, 3], [16, 5], [9, 4], [9, 4], [24, 6], [27, 6], [38, 6], [43, 2], [45, 3], [45, 1], [26, 3], [8, 5], [8, 5], [11, 5], [12, 3], [59, 5], [63, 1], [63, 1], [64, 5], [69, 1], [71, 3], [74, 3], [20, 1], [20, 1], [20, 1], [20, 1], [20, 1], [20, 1], [20, 1], [56, 1], [56, 1], [79, 2], [78, 1], [86, 3], [86, 1], [6, 0], [6, 2], [17, 0], [17, 2], [21, 0], [21, 2], [22, 0], [22, 1], [25, 0], [25, 1], [28, 0], [28, 1], [30, 0], [30, 2], [31, 0], [31, 1], [32, 0], [32, 1], [35, 0], [35, 2], [36, 0], [36, 1], [37, 0], [37, 1], [40, 0], [40, 2], [41, 0], [41, 1], [42, 0], [42, 1], [46, 0], [46, 1], [49, 0], [49, 2], [50, 0], [50, 1], [52, 0], [52, 2], [53, 0], [53, 1], [57, 0], [57, 2], [58, 0], [58, 1], [61, 0], [61, 2], [62, 0], [62, 1], [66, 0], [66, 2], [67, 0], [67, 1], [70, 1], [70, 2], [76, 1], [76, 2]],
      performAction: function anonymous(yytext, yyleng, yylineno, yy, yystate, $$, _$) {
        var $0 = $$.length - 1;
        switch (yystate) {
          case 1:
            return $$[$0 - 1];
            break;
          case 2:
            this.$ = yy.prepareProgram($$[$0]);
            break;
          case 3:
            this.$ = $$[$0];
            break;
          case 4:
            this.$ = $$[$0];
            break;
          case 5:
            this.$ = $$[$0];
            break;
          case 6:
            this.$ = $$[$0];
            break;
          case 7:
            this.$ = $$[$0];
            break;
          case 8:
            this.$ = $$[$0];
            break;
          case 9:
            this.$ = {
              type: "CommentStatement",
              value: yy.stripComment($$[$0]),
              strip: yy.stripFlags($$[$0], $$[$0]),
              loc: yy.locInfo(this._$)
            };
            break;
          case 10:
            this.$ = {
              type: "ContentStatement",
              original: $$[$0],
              value: $$[$0],
              loc: yy.locInfo(this._$)
            };
            break;
          case 11:
            this.$ = yy.prepareRawBlock($$[$0 - 2], $$[$0 - 1], $$[$0], this._$);
            break;
          case 12:
            this.$ = { path: $$[$0 - 3], params: $$[$0 - 2], hash: $$[$0 - 1] };
            break;
          case 13:
            this.$ = yy.prepareBlock($$[$0 - 3], $$[$0 - 2], $$[$0 - 1], $$[$0], false, this._$);
            break;
          case 14:
            this.$ = yy.prepareBlock($$[$0 - 3], $$[$0 - 2], $$[$0 - 1], $$[$0], true, this._$);
            break;
          case 15:
            this.$ = { open: $$[$0 - 5], path: $$[$0 - 4], params: $$[$0 - 3], hash: $$[$0 - 2], blockParams: $$[$0 - 1], strip: yy.stripFlags($$[$0 - 5], $$[$0]) };
            break;
          case 16:
            this.$ = { path: $$[$0 - 4], params: $$[$0 - 3], hash: $$[$0 - 2], blockParams: $$[$0 - 1], strip: yy.stripFlags($$[$0 - 5], $$[$0]) };
            break;
          case 17:
            this.$ = { path: $$[$0 - 4], params: $$[$0 - 3], hash: $$[$0 - 2], blockParams: $$[$0 - 1], strip: yy.stripFlags($$[$0 - 5], $$[$0]) };
            break;
          case 18:
            this.$ = { strip: yy.stripFlags($$[$0 - 1], $$[$0 - 1]), program: $$[$0] };
            break;
          case 19:
            var inverse = yy.prepareBlock($$[$0 - 2], $$[$0 - 1], $$[$0], $$[$0], false, this._$), program = yy.prepareProgram([inverse], $$[$0 - 1].loc);
            program.chained = true;
            this.$ = { strip: $$[$0 - 2].strip, program, chain: true };
            break;
          case 20:
            this.$ = $$[$0];
            break;
          case 21:
            this.$ = { path: $$[$0 - 1], strip: yy.stripFlags($$[$0 - 2], $$[$0]) };
            break;
          case 22:
            this.$ = yy.prepareMustache($$[$0 - 3], $$[$0 - 2], $$[$0 - 1], $$[$0 - 4], yy.stripFlags($$[$0 - 4], $$[$0]), this._$);
            break;
          case 23:
            this.$ = yy.prepareMustache($$[$0 - 3], $$[$0 - 2], $$[$0 - 1], $$[$0 - 4], yy.stripFlags($$[$0 - 4], $$[$0]), this._$);
            break;
          case 24:
            this.$ = {
              type: "PartialStatement",
              name: $$[$0 - 3],
              params: $$[$0 - 2],
              hash: $$[$0 - 1],
              indent: "",
              strip: yy.stripFlags($$[$0 - 4], $$[$0]),
              loc: yy.locInfo(this._$)
            };
            break;
          case 25:
            this.$ = yy.preparePartialBlock($$[$0 - 2], $$[$0 - 1], $$[$0], this._$);
            break;
          case 26:
            this.$ = { path: $$[$0 - 3], params: $$[$0 - 2], hash: $$[$0 - 1], strip: yy.stripFlags($$[$0 - 4], $$[$0]) };
            break;
          case 27:
            this.$ = $$[$0];
            break;
          case 28:
            this.$ = $$[$0];
            break;
          case 29:
            this.$ = {
              type: "SubExpression",
              path: $$[$0 - 3],
              params: $$[$0 - 2],
              hash: $$[$0 - 1],
              loc: yy.locInfo(this._$)
            };
            break;
          case 30:
            this.$ = { type: "Hash", pairs: $$[$0], loc: yy.locInfo(this._$) };
            break;
          case 31:
            this.$ = { type: "HashPair", key: yy.id($$[$0 - 2]), value: $$[$0], loc: yy.locInfo(this._$) };
            break;
          case 32:
            this.$ = yy.id($$[$0 - 1]);
            break;
          case 33:
            this.$ = $$[$0];
            break;
          case 34:
            this.$ = $$[$0];
            break;
          case 35:
            this.$ = { type: "StringLiteral", value: $$[$0], original: $$[$0], loc: yy.locInfo(this._$) };
            break;
          case 36:
            this.$ = { type: "NumberLiteral", value: Number($$[$0]), original: Number($$[$0]), loc: yy.locInfo(this._$) };
            break;
          case 37:
            this.$ = { type: "BooleanLiteral", value: $$[$0] === "true", original: $$[$0] === "true", loc: yy.locInfo(this._$) };
            break;
          case 38:
            this.$ = { type: "UndefinedLiteral", original: undefined, value: undefined, loc: yy.locInfo(this._$) };
            break;
          case 39:
            this.$ = { type: "NullLiteral", original: null, value: null, loc: yy.locInfo(this._$) };
            break;
          case 40:
            this.$ = $$[$0];
            break;
          case 41:
            this.$ = $$[$0];
            break;
          case 42:
            this.$ = yy.preparePath(true, $$[$0], this._$);
            break;
          case 43:
            this.$ = yy.preparePath(false, $$[$0], this._$);
            break;
          case 44:
            $$[$0 - 2].push({ part: yy.id($$[$0]), original: $$[$0], separator: $$[$0 - 1] });
            this.$ = $$[$0 - 2];
            break;
          case 45:
            this.$ = [{ part: yy.id($$[$0]), original: $$[$0] }];
            break;
          case 46:
            this.$ = [];
            break;
          case 47:
            $$[$0 - 1].push($$[$0]);
            break;
          case 48:
            this.$ = [];
            break;
          case 49:
            $$[$0 - 1].push($$[$0]);
            break;
          case 50:
            this.$ = [];
            break;
          case 51:
            $$[$0 - 1].push($$[$0]);
            break;
          case 58:
            this.$ = [];
            break;
          case 59:
            $$[$0 - 1].push($$[$0]);
            break;
          case 64:
            this.$ = [];
            break;
          case 65:
            $$[$0 - 1].push($$[$0]);
            break;
          case 70:
            this.$ = [];
            break;
          case 71:
            $$[$0 - 1].push($$[$0]);
            break;
          case 78:
            this.$ = [];
            break;
          case 79:
            $$[$0 - 1].push($$[$0]);
            break;
          case 82:
            this.$ = [];
            break;
          case 83:
            $$[$0 - 1].push($$[$0]);
            break;
          case 86:
            this.$ = [];
            break;
          case 87:
            $$[$0 - 1].push($$[$0]);
            break;
          case 90:
            this.$ = [];
            break;
          case 91:
            $$[$0 - 1].push($$[$0]);
            break;
          case 94:
            this.$ = [];
            break;
          case 95:
            $$[$0 - 1].push($$[$0]);
            break;
          case 98:
            this.$ = [$$[$0]];
            break;
          case 99:
            $$[$0 - 1].push($$[$0]);
            break;
          case 100:
            this.$ = [$$[$0]];
            break;
          case 101:
            $$[$0 - 1].push($$[$0]);
            break;
        }
      },
      table: [{ 3: 1, 4: 2, 5: [2, 46], 6: 3, 14: [2, 46], 15: [2, 46], 19: [2, 46], 29: [2, 46], 34: [2, 46], 48: [2, 46], 51: [2, 46], 55: [2, 46], 60: [2, 46] }, { 1: [3] }, { 5: [1, 4] }, { 5: [2, 2], 7: 5, 8: 6, 9: 7, 10: 8, 11: 9, 12: 10, 13: 11, 14: [1, 12], 15: [1, 20], 16: 17, 19: [1, 23], 24: 15, 27: 16, 29: [1, 21], 34: [1, 22], 39: [2, 2], 44: [2, 2], 47: [2, 2], 48: [1, 13], 51: [1, 14], 55: [1, 18], 59: 19, 60: [1, 24] }, { 1: [2, 1] }, { 5: [2, 47], 14: [2, 47], 15: [2, 47], 19: [2, 47], 29: [2, 47], 34: [2, 47], 39: [2, 47], 44: [2, 47], 47: [2, 47], 48: [2, 47], 51: [2, 47], 55: [2, 47], 60: [2, 47] }, { 5: [2, 3], 14: [2, 3], 15: [2, 3], 19: [2, 3], 29: [2, 3], 34: [2, 3], 39: [2, 3], 44: [2, 3], 47: [2, 3], 48: [2, 3], 51: [2, 3], 55: [2, 3], 60: [2, 3] }, { 5: [2, 4], 14: [2, 4], 15: [2, 4], 19: [2, 4], 29: [2, 4], 34: [2, 4], 39: [2, 4], 44: [2, 4], 47: [2, 4], 48: [2, 4], 51: [2, 4], 55: [2, 4], 60: [2, 4] }, { 5: [2, 5], 14: [2, 5], 15: [2, 5], 19: [2, 5], 29: [2, 5], 34: [2, 5], 39: [2, 5], 44: [2, 5], 47: [2, 5], 48: [2, 5], 51: [2, 5], 55: [2, 5], 60: [2, 5] }, { 5: [2, 6], 14: [2, 6], 15: [2, 6], 19: [2, 6], 29: [2, 6], 34: [2, 6], 39: [2, 6], 44: [2, 6], 47: [2, 6], 48: [2, 6], 51: [2, 6], 55: [2, 6], 60: [2, 6] }, { 5: [2, 7], 14: [2, 7], 15: [2, 7], 19: [2, 7], 29: [2, 7], 34: [2, 7], 39: [2, 7], 44: [2, 7], 47: [2, 7], 48: [2, 7], 51: [2, 7], 55: [2, 7], 60: [2, 7] }, { 5: [2, 8], 14: [2, 8], 15: [2, 8], 19: [2, 8], 29: [2, 8], 34: [2, 8], 39: [2, 8], 44: [2, 8], 47: [2, 8], 48: [2, 8], 51: [2, 8], 55: [2, 8], 60: [2, 8] }, { 5: [2, 9], 14: [2, 9], 15: [2, 9], 19: [2, 9], 29: [2, 9], 34: [2, 9], 39: [2, 9], 44: [2, 9], 47: [2, 9], 48: [2, 9], 51: [2, 9], 55: [2, 9], 60: [2, 9] }, { 20: 25, 72: [1, 35], 78: 26, 79: 27, 80: [1, 28], 81: [1, 29], 82: [1, 30], 83: [1, 31], 84: [1, 32], 85: [1, 34], 86: 33 }, { 20: 36, 72: [1, 35], 78: 26, 79: 27, 80: [1, 28], 81: [1, 29], 82: [1, 30], 83: [1, 31], 84: [1, 32], 85: [1, 34], 86: 33 }, { 4: 37, 6: 3, 14: [2, 46], 15: [2, 46], 19: [2, 46], 29: [2, 46], 34: [2, 46], 39: [2, 46], 44: [2, 46], 47: [2, 46], 48: [2, 46], 51: [2, 46], 55: [2, 46], 60: [2, 46] }, { 4: 38, 6: 3, 14: [2, 46], 15: [2, 46], 19: [2, 46], 29: [2, 46], 34: [2, 46], 44: [2, 46], 47: [2, 46], 48: [2, 46], 51: [2, 46], 55: [2, 46], 60: [2, 46] }, { 15: [2, 48], 17: 39, 18: [2, 48] }, { 20: 41, 56: 40, 64: 42, 65: [1, 43], 72: [1, 35], 78: 26, 79: 27, 80: [1, 28], 81: [1, 29], 82: [1, 30], 83: [1, 31], 84: [1, 32], 85: [1, 34], 86: 33 }, { 4: 44, 6: 3, 14: [2, 46], 15: [2, 46], 19: [2, 46], 29: [2, 46], 34: [2, 46], 47: [2, 46], 48: [2, 46], 51: [2, 46], 55: [2, 46], 60: [2, 46] }, { 5: [2, 10], 14: [2, 10], 15: [2, 10], 18: [2, 10], 19: [2, 10], 29: [2, 10], 34: [2, 10], 39: [2, 10], 44: [2, 10], 47: [2, 10], 48: [2, 10], 51: [2, 10], 55: [2, 10], 60: [2, 10] }, { 20: 45, 72: [1, 35], 78: 26, 79: 27, 80: [1, 28], 81: [1, 29], 82: [1, 30], 83: [1, 31], 84: [1, 32], 85: [1, 34], 86: 33 }, { 20: 46, 72: [1, 35], 78: 26, 79: 27, 80: [1, 28], 81: [1, 29], 82: [1, 30], 83: [1, 31], 84: [1, 32], 85: [1, 34], 86: 33 }, { 20: 47, 72: [1, 35], 78: 26, 79: 27, 80: [1, 28], 81: [1, 29], 82: [1, 30], 83: [1, 31], 84: [1, 32], 85: [1, 34], 86: 33 }, { 20: 41, 56: 48, 64: 42, 65: [1, 43], 72: [1, 35], 78: 26, 79: 27, 80: [1, 28], 81: [1, 29], 82: [1, 30], 83: [1, 31], 84: [1, 32], 85: [1, 34], 86: 33 }, { 33: [2, 78], 49: 49, 65: [2, 78], 72: [2, 78], 80: [2, 78], 81: [2, 78], 82: [2, 78], 83: [2, 78], 84: [2, 78], 85: [2, 78] }, { 23: [2, 33], 33: [2, 33], 54: [2, 33], 65: [2, 33], 68: [2, 33], 72: [2, 33], 75: [2, 33], 80: [2, 33], 81: [2, 33], 82: [2, 33], 83: [2, 33], 84: [2, 33], 85: [2, 33] }, { 23: [2, 34], 33: [2, 34], 54: [2, 34], 65: [2, 34], 68: [2, 34], 72: [2, 34], 75: [2, 34], 80: [2, 34], 81: [2, 34], 82: [2, 34], 83: [2, 34], 84: [2, 34], 85: [2, 34] }, { 23: [2, 35], 33: [2, 35], 54: [2, 35], 65: [2, 35], 68: [2, 35], 72: [2, 35], 75: [2, 35], 80: [2, 35], 81: [2, 35], 82: [2, 35], 83: [2, 35], 84: [2, 35], 85: [2, 35] }, { 23: [2, 36], 33: [2, 36], 54: [2, 36], 65: [2, 36], 68: [2, 36], 72: [2, 36], 75: [2, 36], 80: [2, 36], 81: [2, 36], 82: [2, 36], 83: [2, 36], 84: [2, 36], 85: [2, 36] }, { 23: [2, 37], 33: [2, 37], 54: [2, 37], 65: [2, 37], 68: [2, 37], 72: [2, 37], 75: [2, 37], 80: [2, 37], 81: [2, 37], 82: [2, 37], 83: [2, 37], 84: [2, 37], 85: [2, 37] }, { 23: [2, 38], 33: [2, 38], 54: [2, 38], 65: [2, 38], 68: [2, 38], 72: [2, 38], 75: [2, 38], 80: [2, 38], 81: [2, 38], 82: [2, 38], 83: [2, 38], 84: [2, 38], 85: [2, 38] }, { 23: [2, 39], 33: [2, 39], 54: [2, 39], 65: [2, 39], 68: [2, 39], 72: [2, 39], 75: [2, 39], 80: [2, 39], 81: [2, 39], 82: [2, 39], 83: [2, 39], 84: [2, 39], 85: [2, 39] }, { 23: [2, 43], 33: [2, 43], 54: [2, 43], 65: [2, 43], 68: [2, 43], 72: [2, 43], 75: [2, 43], 80: [2, 43], 81: [2, 43], 82: [2, 43], 83: [2, 43], 84: [2, 43], 85: [2, 43], 87: [1, 50] }, { 72: [1, 35], 86: 51 }, { 23: [2, 45], 33: [2, 45], 54: [2, 45], 65: [2, 45], 68: [2, 45], 72: [2, 45], 75: [2, 45], 80: [2, 45], 81: [2, 45], 82: [2, 45], 83: [2, 45], 84: [2, 45], 85: [2, 45], 87: [2, 45] }, { 52: 52, 54: [2, 82], 65: [2, 82], 72: [2, 82], 80: [2, 82], 81: [2, 82], 82: [2, 82], 83: [2, 82], 84: [2, 82], 85: [2, 82] }, { 25: 53, 38: 55, 39: [1, 57], 43: 56, 44: [1, 58], 45: 54, 47: [2, 54] }, { 28: 59, 43: 60, 44: [1, 58], 47: [2, 56] }, { 13: 62, 15: [1, 20], 18: [1, 61] }, { 33: [2, 86], 57: 63, 65: [2, 86], 72: [2, 86], 80: [2, 86], 81: [2, 86], 82: [2, 86], 83: [2, 86], 84: [2, 86], 85: [2, 86] }, { 33: [2, 40], 65: [2, 40], 72: [2, 40], 80: [2, 40], 81: [2, 40], 82: [2, 40], 83: [2, 40], 84: [2, 40], 85: [2, 40] }, { 33: [2, 41], 65: [2, 41], 72: [2, 41], 80: [2, 41], 81: [2, 41], 82: [2, 41], 83: [2, 41], 84: [2, 41], 85: [2, 41] }, { 20: 64, 72: [1, 35], 78: 26, 79: 27, 80: [1, 28], 81: [1, 29], 82: [1, 30], 83: [1, 31], 84: [1, 32], 85: [1, 34], 86: 33 }, { 26: 65, 47: [1, 66] }, { 30: 67, 33: [2, 58], 65: [2, 58], 72: [2, 58], 75: [2, 58], 80: [2, 58], 81: [2, 58], 82: [2, 58], 83: [2, 58], 84: [2, 58], 85: [2, 58] }, { 33: [2, 64], 35: 68, 65: [2, 64], 72: [2, 64], 75: [2, 64], 80: [2, 64], 81: [2, 64], 82: [2, 64], 83: [2, 64], 84: [2, 64], 85: [2, 64] }, { 21: 69, 23: [2, 50], 65: [2, 50], 72: [2, 50], 80: [2, 50], 81: [2, 50], 82: [2, 50], 83: [2, 50], 84: [2, 50], 85: [2, 50] }, { 33: [2, 90], 61: 70, 65: [2, 90], 72: [2, 90], 80: [2, 90], 81: [2, 90], 82: [2, 90], 83: [2, 90], 84: [2, 90], 85: [2, 90] }, { 20: 74, 33: [2, 80], 50: 71, 63: 72, 64: 75, 65: [1, 43], 69: 73, 70: 76, 71: 77, 72: [1, 78], 78: 26, 79: 27, 80: [1, 28], 81: [1, 29], 82: [1, 30], 83: [1, 31], 84: [1, 32], 85: [1, 34], 86: 33 }, { 72: [1, 79] }, { 23: [2, 42], 33: [2, 42], 54: [2, 42], 65: [2, 42], 68: [2, 42], 72: [2, 42], 75: [2, 42], 80: [2, 42], 81: [2, 42], 82: [2, 42], 83: [2, 42], 84: [2, 42], 85: [2, 42], 87: [1, 50] }, { 20: 74, 53: 80, 54: [2, 84], 63: 81, 64: 75, 65: [1, 43], 69: 82, 70: 76, 71: 77, 72: [1, 78], 78: 26, 79: 27, 80: [1, 28], 81: [1, 29], 82: [1, 30], 83: [1, 31], 84: [1, 32], 85: [1, 34], 86: 33 }, { 26: 83, 47: [1, 66] }, { 47: [2, 55] }, { 4: 84, 6: 3, 14: [2, 46], 15: [2, 46], 19: [2, 46], 29: [2, 46], 34: [2, 46], 39: [2, 46], 44: [2, 46], 47: [2, 46], 48: [2, 46], 51: [2, 46], 55: [2, 46], 60: [2, 46] }, { 47: [2, 20] }, { 20: 85, 72: [1, 35], 78: 26, 79: 27, 80: [1, 28], 81: [1, 29], 82: [1, 30], 83: [1, 31], 84: [1, 32], 85: [1, 34], 86: 33 }, { 4: 86, 6: 3, 14: [2, 46], 15: [2, 46], 19: [2, 46], 29: [2, 46], 34: [2, 46], 47: [2, 46], 48: [2, 46], 51: [2, 46], 55: [2, 46], 60: [2, 46] }, { 26: 87, 47: [1, 66] }, { 47: [2, 57] }, { 5: [2, 11], 14: [2, 11], 15: [2, 11], 19: [2, 11], 29: [2, 11], 34: [2, 11], 39: [2, 11], 44: [2, 11], 47: [2, 11], 48: [2, 11], 51: [2, 11], 55: [2, 11], 60: [2, 11] }, { 15: [2, 49], 18: [2, 49] }, { 20: 74, 33: [2, 88], 58: 88, 63: 89, 64: 75, 65: [1, 43], 69: 90, 70: 76, 71: 77, 72: [1, 78], 78: 26, 79: 27, 80: [1, 28], 81: [1, 29], 82: [1, 30], 83: [1, 31], 84: [1, 32], 85: [1, 34], 86: 33 }, { 65: [2, 94], 66: 91, 68: [2, 94], 72: [2, 94], 80: [2, 94], 81: [2, 94], 82: [2, 94], 83: [2, 94], 84: [2, 94], 85: [2, 94] }, { 5: [2, 25], 14: [2, 25], 15: [2, 25], 19: [2, 25], 29: [2, 25], 34: [2, 25], 39: [2, 25], 44: [2, 25], 47: [2, 25], 48: [2, 25], 51: [2, 25], 55: [2, 25], 60: [2, 25] }, { 20: 92, 72: [1, 35], 78: 26, 79: 27, 80: [1, 28], 81: [1, 29], 82: [1, 30], 83: [1, 31], 84: [1, 32], 85: [1, 34], 86: 33 }, { 20: 74, 31: 93, 33: [2, 60], 63: 94, 64: 75, 65: [1, 43], 69: 95, 70: 76, 71: 77, 72: [1, 78], 75: [2, 60], 78: 26, 79: 27, 80: [1, 28], 81: [1, 29], 82: [1, 30], 83: [1, 31], 84: [1, 32], 85: [1, 34], 86: 33 }, { 20: 74, 33: [2, 66], 36: 96, 63: 97, 64: 75, 65: [1, 43], 69: 98, 70: 76, 71: 77, 72: [1, 78], 75: [2, 66], 78: 26, 79: 27, 80: [1, 28], 81: [1, 29], 82: [1, 30], 83: [1, 31], 84: [1, 32], 85: [1, 34], 86: 33 }, { 20: 74, 22: 99, 23: [2, 52], 63: 100, 64: 75, 65: [1, 43], 69: 101, 70: 76, 71: 77, 72: [1, 78], 78: 26, 79: 27, 80: [1, 28], 81: [1, 29], 82: [1, 30], 83: [1, 31], 84: [1, 32], 85: [1, 34], 86: 33 }, { 20: 74, 33: [2, 92], 62: 102, 63: 103, 64: 75, 65: [1, 43], 69: 104, 70: 76, 71: 77, 72: [1, 78], 78: 26, 79: 27, 80: [1, 28], 81: [1, 29], 82: [1, 30], 83: [1, 31], 84: [1, 32], 85: [1, 34], 86: 33 }, { 33: [1, 105] }, { 33: [2, 79], 65: [2, 79], 72: [2, 79], 80: [2, 79], 81: [2, 79], 82: [2, 79], 83: [2, 79], 84: [2, 79], 85: [2, 79] }, { 33: [2, 81] }, { 23: [2, 27], 33: [2, 27], 54: [2, 27], 65: [2, 27], 68: [2, 27], 72: [2, 27], 75: [2, 27], 80: [2, 27], 81: [2, 27], 82: [2, 27], 83: [2, 27], 84: [2, 27], 85: [2, 27] }, { 23: [2, 28], 33: [2, 28], 54: [2, 28], 65: [2, 28], 68: [2, 28], 72: [2, 28], 75: [2, 28], 80: [2, 28], 81: [2, 28], 82: [2, 28], 83: [2, 28], 84: [2, 28], 85: [2, 28] }, { 23: [2, 30], 33: [2, 30], 54: [2, 30], 68: [2, 30], 71: 106, 72: [1, 107], 75: [2, 30] }, { 23: [2, 98], 33: [2, 98], 54: [2, 98], 68: [2, 98], 72: [2, 98], 75: [2, 98] }, { 23: [2, 45], 33: [2, 45], 54: [2, 45], 65: [2, 45], 68: [2, 45], 72: [2, 45], 73: [1, 108], 75: [2, 45], 80: [2, 45], 81: [2, 45], 82: [2, 45], 83: [2, 45], 84: [2, 45], 85: [2, 45], 87: [2, 45] }, { 23: [2, 44], 33: [2, 44], 54: [2, 44], 65: [2, 44], 68: [2, 44], 72: [2, 44], 75: [2, 44], 80: [2, 44], 81: [2, 44], 82: [2, 44], 83: [2, 44], 84: [2, 44], 85: [2, 44], 87: [2, 44] }, { 54: [1, 109] }, { 54: [2, 83], 65: [2, 83], 72: [2, 83], 80: [2, 83], 81: [2, 83], 82: [2, 83], 83: [2, 83], 84: [2, 83], 85: [2, 83] }, { 54: [2, 85] }, { 5: [2, 13], 14: [2, 13], 15: [2, 13], 19: [2, 13], 29: [2, 13], 34: [2, 13], 39: [2, 13], 44: [2, 13], 47: [2, 13], 48: [2, 13], 51: [2, 13], 55: [2, 13], 60: [2, 13] }, { 38: 55, 39: [1, 57], 43: 56, 44: [1, 58], 45: 111, 46: 110, 47: [2, 76] }, { 33: [2, 70], 40: 112, 65: [2, 70], 72: [2, 70], 75: [2, 70], 80: [2, 70], 81: [2, 70], 82: [2, 70], 83: [2, 70], 84: [2, 70], 85: [2, 70] }, { 47: [2, 18] }, { 5: [2, 14], 14: [2, 14], 15: [2, 14], 19: [2, 14], 29: [2, 14], 34: [2, 14], 39: [2, 14], 44: [2, 14], 47: [2, 14], 48: [2, 14], 51: [2, 14], 55: [2, 14], 60: [2, 14] }, { 33: [1, 113] }, { 33: [2, 87], 65: [2, 87], 72: [2, 87], 80: [2, 87], 81: [2, 87], 82: [2, 87], 83: [2, 87], 84: [2, 87], 85: [2, 87] }, { 33: [2, 89] }, { 20: 74, 63: 115, 64: 75, 65: [1, 43], 67: 114, 68: [2, 96], 69: 116, 70: 76, 71: 77, 72: [1, 78], 78: 26, 79: 27, 80: [1, 28], 81: [1, 29], 82: [1, 30], 83: [1, 31], 84: [1, 32], 85: [1, 34], 86: 33 }, { 33: [1, 117] }, { 32: 118, 33: [2, 62], 74: 119, 75: [1, 120] }, { 33: [2, 59], 65: [2, 59], 72: [2, 59], 75: [2, 59], 80: [2, 59], 81: [2, 59], 82: [2, 59], 83: [2, 59], 84: [2, 59], 85: [2, 59] }, { 33: [2, 61], 75: [2, 61] }, { 33: [2, 68], 37: 121, 74: 122, 75: [1, 120] }, { 33: [2, 65], 65: [2, 65], 72: [2, 65], 75: [2, 65], 80: [2, 65], 81: [2, 65], 82: [2, 65], 83: [2, 65], 84: [2, 65], 85: [2, 65] }, { 33: [2, 67], 75: [2, 67] }, { 23: [1, 123] }, { 23: [2, 51], 65: [2, 51], 72: [2, 51], 80: [2, 51], 81: [2, 51], 82: [2, 51], 83: [2, 51], 84: [2, 51], 85: [2, 51] }, { 23: [2, 53] }, { 33: [1, 124] }, { 33: [2, 91], 65: [2, 91], 72: [2, 91], 80: [2, 91], 81: [2, 91], 82: [2, 91], 83: [2, 91], 84: [2, 91], 85: [2, 91] }, { 33: [2, 93] }, { 5: [2, 22], 14: [2, 22], 15: [2, 22], 19: [2, 22], 29: [2, 22], 34: [2, 22], 39: [2, 22], 44: [2, 22], 47: [2, 22], 48: [2, 22], 51: [2, 22], 55: [2, 22], 60: [2, 22] }, { 23: [2, 99], 33: [2, 99], 54: [2, 99], 68: [2, 99], 72: [2, 99], 75: [2, 99] }, { 73: [1, 108] }, { 20: 74, 63: 125, 64: 75, 65: [1, 43], 72: [1, 35], 78: 26, 79: 27, 80: [1, 28], 81: [1, 29], 82: [1, 30], 83: [1, 31], 84: [1, 32], 85: [1, 34], 86: 33 }, { 5: [2, 23], 14: [2, 23], 15: [2, 23], 19: [2, 23], 29: [2, 23], 34: [2, 23], 39: [2, 23], 44: [2, 23], 47: [2, 23], 48: [2, 23], 51: [2, 23], 55: [2, 23], 60: [2, 23] }, { 47: [2, 19] }, { 47: [2, 77] }, { 20: 74, 33: [2, 72], 41: 126, 63: 127, 64: 75, 65: [1, 43], 69: 128, 70: 76, 71: 77, 72: [1, 78], 75: [2, 72], 78: 26, 79: 27, 80: [1, 28], 81: [1, 29], 82: [1, 30], 83: [1, 31], 84: [1, 32], 85: [1, 34], 86: 33 }, { 5: [2, 24], 14: [2, 24], 15: [2, 24], 19: [2, 24], 29: [2, 24], 34: [2, 24], 39: [2, 24], 44: [2, 24], 47: [2, 24], 48: [2, 24], 51: [2, 24], 55: [2, 24], 60: [2, 24] }, { 68: [1, 129] }, { 65: [2, 95], 68: [2, 95], 72: [2, 95], 80: [2, 95], 81: [2, 95], 82: [2, 95], 83: [2, 95], 84: [2, 95], 85: [2, 95] }, { 68: [2, 97] }, { 5: [2, 21], 14: [2, 21], 15: [2, 21], 19: [2, 21], 29: [2, 21], 34: [2, 21], 39: [2, 21], 44: [2, 21], 47: [2, 21], 48: [2, 21], 51: [2, 21], 55: [2, 21], 60: [2, 21] }, { 33: [1, 130] }, { 33: [2, 63] }, { 72: [1, 132], 76: 131 }, { 33: [1, 133] }, { 33: [2, 69] }, { 15: [2, 12], 18: [2, 12] }, { 14: [2, 26], 15: [2, 26], 19: [2, 26], 29: [2, 26], 34: [2, 26], 47: [2, 26], 48: [2, 26], 51: [2, 26], 55: [2, 26], 60: [2, 26] }, { 23: [2, 31], 33: [2, 31], 54: [2, 31], 68: [2, 31], 72: [2, 31], 75: [2, 31] }, { 33: [2, 74], 42: 134, 74: 135, 75: [1, 120] }, { 33: [2, 71], 65: [2, 71], 72: [2, 71], 75: [2, 71], 80: [2, 71], 81: [2, 71], 82: [2, 71], 83: [2, 71], 84: [2, 71], 85: [2, 71] }, { 33: [2, 73], 75: [2, 73] }, { 23: [2, 29], 33: [2, 29], 54: [2, 29], 65: [2, 29], 68: [2, 29], 72: [2, 29], 75: [2, 29], 80: [2, 29], 81: [2, 29], 82: [2, 29], 83: [2, 29], 84: [2, 29], 85: [2, 29] }, { 14: [2, 15], 15: [2, 15], 19: [2, 15], 29: [2, 15], 34: [2, 15], 39: [2, 15], 44: [2, 15], 47: [2, 15], 48: [2, 15], 51: [2, 15], 55: [2, 15], 60: [2, 15] }, { 72: [1, 137], 77: [1, 136] }, { 72: [2, 100], 77: [2, 100] }, { 14: [2, 16], 15: [2, 16], 19: [2, 16], 29: [2, 16], 34: [2, 16], 44: [2, 16], 47: [2, 16], 48: [2, 16], 51: [2, 16], 55: [2, 16], 60: [2, 16] }, { 33: [1, 138] }, { 33: [2, 75] }, { 33: [2, 32] }, { 72: [2, 101], 77: [2, 101] }, { 14: [2, 17], 15: [2, 17], 19: [2, 17], 29: [2, 17], 34: [2, 17], 39: [2, 17], 44: [2, 17], 47: [2, 17], 48: [2, 17], 51: [2, 17], 55: [2, 17], 60: [2, 17] }],
      defaultActions: { 4: [2, 1], 54: [2, 55], 56: [2, 20], 60: [2, 57], 73: [2, 81], 82: [2, 85], 86: [2, 18], 90: [2, 89], 101: [2, 53], 104: [2, 93], 110: [2, 19], 111: [2, 77], 116: [2, 97], 119: [2, 63], 122: [2, 69], 135: [2, 75], 136: [2, 32] },
      parseError: function parseError(str, hash) {
        throw new Error(str);
      },
      parse: function parse(input) {
        var self2 = this, stack = [0], vstack = [null], lstack = [], table = this.table, yytext = "", yylineno = 0, yyleng = 0, recovering = 0, TERROR = 2, EOF = 1;
        this.lexer.setInput(input);
        this.lexer.yy = this.yy;
        this.yy.lexer = this.lexer;
        this.yy.parser = this;
        if (typeof this.lexer.yylloc == "undefined")
          this.lexer.yylloc = {};
        var yyloc = this.lexer.yylloc;
        lstack.push(yyloc);
        var ranges = this.lexer.options && this.lexer.options.ranges;
        if (typeof this.yy.parseError === "function")
          this.parseError = this.yy.parseError;
        function popStack(n) {
          stack.length = stack.length - 2 * n;
          vstack.length = vstack.length - n;
          lstack.length = lstack.length - n;
        }
        function lex() {
          var token;
          token = self2.lexer.lex() || 1;
          if (typeof token !== "number") {
            token = self2.symbols_[token] || token;
          }
          return token;
        }
        var symbol, preErrorSymbol, state, action, a, r, yyval = {}, p, len, newState, expected;
        while (true) {
          state = stack[stack.length - 1];
          if (this.defaultActions[state]) {
            action = this.defaultActions[state];
          } else {
            if (symbol === null || typeof symbol == "undefined") {
              symbol = lex();
            }
            action = table[state] && table[state][symbol];
          }
          if (typeof action === "undefined" || !action.length || !action[0]) {
            var errStr = "";
            if (!recovering) {
              expected = [];
              for (p in table[state])
                if (this.terminals_[p] && p > 2) {
                  expected.push("'" + this.terminals_[p] + "'");
                }
              if (this.lexer.showPosition) {
                errStr = "Parse error on line " + (yylineno + 1) + `:
` + this.lexer.showPosition() + `
Expecting ` + expected.join(", ") + ", got '" + (this.terminals_[symbol] || symbol) + "'";
              } else {
                errStr = "Parse error on line " + (yylineno + 1) + ": Unexpected " + (symbol == 1 ? "end of input" : "'" + (this.terminals_[symbol] || symbol) + "'");
              }
              this.parseError(errStr, { text: this.lexer.match, token: this.terminals_[symbol] || symbol, line: this.lexer.yylineno, loc: yyloc, expected });
            }
          }
          if (action[0] instanceof Array && action.length > 1) {
            throw new Error("Parse Error: multiple actions possible at state: " + state + ", token: " + symbol);
          }
          switch (action[0]) {
            case 1:
              stack.push(symbol);
              vstack.push(this.lexer.yytext);
              lstack.push(this.lexer.yylloc);
              stack.push(action[1]);
              symbol = null;
              if (!preErrorSymbol) {
                yyleng = this.lexer.yyleng;
                yytext = this.lexer.yytext;
                yylineno = this.lexer.yylineno;
                yyloc = this.lexer.yylloc;
                if (recovering > 0)
                  recovering--;
              } else {
                symbol = preErrorSymbol;
                preErrorSymbol = null;
              }
              break;
            case 2:
              len = this.productions_[action[1]][1];
              yyval.$ = vstack[vstack.length - len];
              yyval._$ = { first_line: lstack[lstack.length - (len || 1)].first_line, last_line: lstack[lstack.length - 1].last_line, first_column: lstack[lstack.length - (len || 1)].first_column, last_column: lstack[lstack.length - 1].last_column };
              if (ranges) {
                yyval._$.range = [lstack[lstack.length - (len || 1)].range[0], lstack[lstack.length - 1].range[1]];
              }
              r = this.performAction.call(yyval, yytext, yyleng, yylineno, this.yy, action[1], vstack, lstack);
              if (typeof r !== "undefined") {
                return r;
              }
              if (len) {
                stack = stack.slice(0, -1 * len * 2);
                vstack = vstack.slice(0, -1 * len);
                lstack = lstack.slice(0, -1 * len);
              }
              stack.push(this.productions_[action[1]][0]);
              vstack.push(yyval.$);
              lstack.push(yyval._$);
              newState = table[stack[stack.length - 2]][stack[stack.length - 1]];
              stack.push(newState);
              break;
            case 3:
              return true;
          }
        }
        return true;
      }
    };
    var lexer = function() {
      var lexer = {
        EOF: 1,
        parseError: function parseError(str, hash) {
          if (this.yy.parser) {
            this.yy.parser.parseError(str, hash);
          } else {
            throw new Error(str);
          }
        },
        setInput: function setInput(input) {
          this._input = input;
          this._more = this._less = this.done = false;
          this.yylineno = this.yyleng = 0;
          this.yytext = this.matched = this.match = "";
          this.conditionStack = ["INITIAL"];
          this.yylloc = { first_line: 1, first_column: 0, last_line: 1, last_column: 0 };
          if (this.options.ranges)
            this.yylloc.range = [0, 0];
          this.offset = 0;
          return this;
        },
        input: function input() {
          var ch = this._input[0];
          this.yytext += ch;
          this.yyleng++;
          this.offset++;
          this.match += ch;
          this.matched += ch;
          var lines = ch.match(/(?:\r\n?|\n).*/g);
          if (lines) {
            this.yylineno++;
            this.yylloc.last_line++;
          } else {
            this.yylloc.last_column++;
          }
          if (this.options.ranges)
            this.yylloc.range[1]++;
          this._input = this._input.slice(1);
          return ch;
        },
        unput: function unput(ch) {
          var len = ch.length;
          var lines = ch.split(/(?:\r\n?|\n)/g);
          this._input = ch + this._input;
          this.yytext = this.yytext.substr(0, this.yytext.length - len - 1);
          this.offset -= len;
          var oldLines = this.match.split(/(?:\r\n?|\n)/g);
          this.match = this.match.substr(0, this.match.length - 1);
          this.matched = this.matched.substr(0, this.matched.length - 1);
          if (lines.length - 1)
            this.yylineno -= lines.length - 1;
          var r = this.yylloc.range;
          this.yylloc = {
            first_line: this.yylloc.first_line,
            last_line: this.yylineno + 1,
            first_column: this.yylloc.first_column,
            last_column: lines ? (lines.length === oldLines.length ? this.yylloc.first_column : 0) + oldLines[oldLines.length - lines.length].length - lines[0].length : this.yylloc.first_column - len
          };
          if (this.options.ranges) {
            this.yylloc.range = [r[0], r[0] + this.yyleng - len];
          }
          return this;
        },
        more: function more() {
          this._more = true;
          return this;
        },
        less: function less(n) {
          this.unput(this.match.slice(n));
        },
        pastInput: function pastInput() {
          var past = this.matched.substr(0, this.matched.length - this.match.length);
          return (past.length > 20 ? "..." : "") + past.substr(-20).replace(/\n/g, "");
        },
        upcomingInput: function upcomingInput() {
          var next = this.match;
          if (next.length < 20) {
            next += this._input.substr(0, 20 - next.length);
          }
          return (next.substr(0, 20) + (next.length > 20 ? "..." : "")).replace(/\n/g, "");
        },
        showPosition: function showPosition() {
          var pre = this.pastInput();
          var c = new Array(pre.length + 1).join("-");
          return pre + this.upcomingInput() + `
` + c + "^";
        },
        next: function next() {
          if (this.done) {
            return this.EOF;
          }
          if (!this._input)
            this.done = true;
          var token, match, tempMatch, index, col, lines;
          if (!this._more) {
            this.yytext = "";
            this.match = "";
          }
          var rules = this._currentRules();
          for (var i = 0;i < rules.length; i++) {
            tempMatch = this._input.match(this.rules[rules[i]]);
            if (tempMatch && (!match || tempMatch[0].length > match[0].length)) {
              match = tempMatch;
              index = i;
              if (!this.options.flex)
                break;
            }
          }
          if (match) {
            lines = match[0].match(/(?:\r\n?|\n).*/g);
            if (lines)
              this.yylineno += lines.length;
            this.yylloc = {
              first_line: this.yylloc.last_line,
              last_line: this.yylineno + 1,
              first_column: this.yylloc.last_column,
              last_column: lines ? lines[lines.length - 1].length - lines[lines.length - 1].match(/\r?\n?/)[0].length : this.yylloc.last_column + match[0].length
            };
            this.yytext += match[0];
            this.match += match[0];
            this.matches = match;
            this.yyleng = this.yytext.length;
            if (this.options.ranges) {
              this.yylloc.range = [this.offset, this.offset += this.yyleng];
            }
            this._more = false;
            this._input = this._input.slice(match[0].length);
            this.matched += match[0];
            token = this.performAction.call(this, this.yy, this, rules[index], this.conditionStack[this.conditionStack.length - 1]);
            if (this.done && this._input)
              this.done = false;
            if (token)
              return token;
            else
              return;
          }
          if (this._input === "") {
            return this.EOF;
          } else {
            return this.parseError("Lexical error on line " + (this.yylineno + 1) + `. Unrecognized text.
` + this.showPosition(), { text: "", token: null, line: this.yylineno });
          }
        },
        lex: function lex() {
          var r = this.next();
          if (typeof r !== "undefined") {
            return r;
          } else {
            return this.lex();
          }
        },
        begin: function begin(condition) {
          this.conditionStack.push(condition);
        },
        popState: function popState() {
          return this.conditionStack.pop();
        },
        _currentRules: function _currentRules() {
          return this.conditions[this.conditionStack[this.conditionStack.length - 1]].rules;
        },
        topState: function topState() {
          return this.conditionStack[this.conditionStack.length - 2];
        },
        pushState: function begin(condition) {
          this.begin(condition);
        }
      };
      lexer.options = {};
      lexer.performAction = function anonymous(yy, yy_, $avoiding_name_collisions, YY_START) {
        function strip(start, end) {
          return yy_.yytext = yy_.yytext.substring(start, yy_.yyleng - end + start);
        }
        var YYSTATE = YY_START;
        switch ($avoiding_name_collisions) {
          case 0:
            if (yy_.yytext.slice(-2) === "\\\\") {
              strip(0, 1);
              this.begin("mu");
            } else if (yy_.yytext.slice(-1) === "\\") {
              strip(0, 1);
              this.begin("emu");
            } else {
              this.begin("mu");
            }
            if (yy_.yytext)
              return 15;
            break;
          case 1:
            return 15;
            break;
          case 2:
            this.popState();
            return 15;
            break;
          case 3:
            this.begin("raw");
            return 15;
            break;
          case 4:
            this.popState();
            if (this.conditionStack[this.conditionStack.length - 1] === "raw") {
              return 15;
            } else {
              strip(5, 9);
              return "END_RAW_BLOCK";
            }
            break;
          case 5:
            return 15;
            break;
          case 6:
            this.popState();
            return 14;
            break;
          case 7:
            return 65;
            break;
          case 8:
            return 68;
            break;
          case 9:
            return 19;
            break;
          case 10:
            this.popState();
            this.begin("raw");
            return 23;
            break;
          case 11:
            return 55;
            break;
          case 12:
            return 60;
            break;
          case 13:
            return 29;
            break;
          case 14:
            return 47;
            break;
          case 15:
            this.popState();
            return 44;
            break;
          case 16:
            this.popState();
            return 44;
            break;
          case 17:
            return 34;
            break;
          case 18:
            return 39;
            break;
          case 19:
            return 51;
            break;
          case 20:
            return 48;
            break;
          case 21:
            this.unput(yy_.yytext);
            this.popState();
            this.begin("com");
            break;
          case 22:
            this.popState();
            return 14;
            break;
          case 23:
            return 48;
            break;
          case 24:
            return 73;
            break;
          case 25:
            return 72;
            break;
          case 26:
            return 72;
            break;
          case 27:
            return 87;
            break;
          case 28:
            break;
          case 29:
            this.popState();
            return 54;
            break;
          case 30:
            this.popState();
            return 33;
            break;
          case 31:
            yy_.yytext = strip(1, 2).replace(/\\"/g, '"');
            return 80;
            break;
          case 32:
            yy_.yytext = strip(1, 2).replace(/\\'/g, "'");
            return 80;
            break;
          case 33:
            return 85;
            break;
          case 34:
            return 82;
            break;
          case 35:
            return 82;
            break;
          case 36:
            return 83;
            break;
          case 37:
            return 84;
            break;
          case 38:
            return 81;
            break;
          case 39:
            return 75;
            break;
          case 40:
            return 77;
            break;
          case 41:
            return 72;
            break;
          case 42:
            yy_.yytext = yy_.yytext.replace(/\\([\\\]])/g, "$1");
            return 72;
            break;
          case 43:
            return "INVALID";
            break;
          case 44:
            return 5;
            break;
        }
      };
      lexer.rules = [/^(?:[^\x00]*?(?=(\{\{)))/, /^(?:[^\x00]+)/, /^(?:[^\x00]{2,}?(?=(\{\{|\\\{\{|\\\\\{\{|$)))/, /^(?:\{\{\{\{(?=[^\/]))/, /^(?:\{\{\{\{\/[^\s!"#%-,\.\/;->@\[-\^`\{-~]+(?=[=}\s\/.])\}\}\}\})/, /^(?:[^\x00]+?(?=(\{\{\{\{)))/, /^(?:[\s\S]*?--(~)?\}\})/, /^(?:\()/, /^(?:\))/, /^(?:\{\{\{\{)/, /^(?:\}\}\}\})/, /^(?:\{\{(~)?>)/, /^(?:\{\{(~)?#>)/, /^(?:\{\{(~)?#\*?)/, /^(?:\{\{(~)?\/)/, /^(?:\{\{(~)?\^\s*(~)?\}\})/, /^(?:\{\{(~)?\s*else\s*(~)?\}\})/, /^(?:\{\{(~)?\^)/, /^(?:\{\{(~)?\s*else\b)/, /^(?:\{\{(~)?\{)/, /^(?:\{\{(~)?&)/, /^(?:\{\{(~)?!--)/, /^(?:\{\{(~)?![\s\S]*?\}\})/, /^(?:\{\{(~)?\*?)/, /^(?:=)/, /^(?:\.\.)/, /^(?:\.(?=([=~}\s\/.)|])))/, /^(?:[\/.])/, /^(?:\s+)/, /^(?:\}(~)?\}\})/, /^(?:(~)?\}\})/, /^(?:"(\\["]|[^"])*")/, /^(?:'(\\[']|[^'])*')/, /^(?:@)/, /^(?:true(?=([~}\s)])))/, /^(?:false(?=([~}\s)])))/, /^(?:undefined(?=([~}\s)])))/, /^(?:null(?=([~}\s)])))/, /^(?:-?[0-9]+(?:\.[0-9]+)?(?=([~}\s)])))/, /^(?:as\s+\|)/, /^(?:\|)/, /^(?:([^\s!"#%-,\.\/;->@\[-\^`\{-~]+(?=([=~}\s\/.)|]))))/, /^(?:\[(\\\]|[^\]])*\])/, /^(?:.)/, /^(?:$)/];
      lexer.conditions = { mu: { rules: [7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44], inclusive: false }, emu: { rules: [2], inclusive: false }, com: { rules: [6], inclusive: false }, raw: { rules: [3, 4, 5], inclusive: false }, INITIAL: { rules: [0, 1, 44], inclusive: true } };
      return lexer;
    }();
    parser.lexer = lexer;
    function Parser() {
      this.yy = {};
    }
    Parser.prototype = parser;
    parser.Parser = Parser;
    return new Parser;
  }();
  exports.default = handlebars;
  module.exports = exports["default"];
});

// node_modules/.bun/handlebars@4.7.9/node_modules/handlebars/dist/cjs/handlebars/compiler/visitor.js
var require_visitor = __commonJS(function(exports, module) {
  exports.__esModule = true;
  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
  }
  var _exception = require_exception();
  var _exception2 = _interopRequireDefault(_exception);
  function Visitor() {
    this.parents = [];
  }
  Visitor.prototype = {
    constructor: Visitor,
    mutating: false,
    acceptKey: function acceptKey(node, name) {
      var value = this.accept(node[name]);
      if (this.mutating) {
        if (value && !Visitor.prototype[value.type]) {
          throw new _exception2["default"]('Unexpected node type "' + value.type + '" found when accepting ' + name + " on " + node.type);
        }
        node[name] = value;
      }
    },
    acceptRequired: function acceptRequired(node, name) {
      this.acceptKey(node, name);
      if (!node[name]) {
        throw new _exception2["default"](node.type + " requires " + name);
      }
    },
    acceptArray: function acceptArray(array) {
      for (var i = 0, l = array.length;i < l; i++) {
        this.acceptKey(array, i);
        if (!array[i]) {
          array.splice(i, 1);
          i--;
          l--;
        }
      }
    },
    accept: function accept(object) {
      if (!object) {
        return;
      }
      if (!this[object.type]) {
        throw new _exception2["default"]("Unknown type: " + object.type, object);
      }
      if (this.current) {
        this.parents.unshift(this.current);
      }
      this.current = object;
      var ret = this[object.type](object);
      this.current = this.parents.shift();
      if (!this.mutating || ret) {
        return ret;
      } else if (ret !== false) {
        return object;
      }
    },
    Program: function Program(program) {
      this.acceptArray(program.body);
    },
    MustacheStatement: visitSubExpression,
    Decorator: visitSubExpression,
    BlockStatement: visitBlock,
    DecoratorBlock: visitBlock,
    PartialStatement: visitPartial,
    PartialBlockStatement: function PartialBlockStatement(partial) {
      visitPartial.call(this, partial);
      this.acceptKey(partial, "program");
    },
    ContentStatement: function ContentStatement() {},
    CommentStatement: function CommentStatement() {},
    SubExpression: visitSubExpression,
    PathExpression: function PathExpression() {},
    StringLiteral: function StringLiteral() {},
    NumberLiteral: function NumberLiteral() {},
    BooleanLiteral: function BooleanLiteral() {},
    UndefinedLiteral: function UndefinedLiteral() {},
    NullLiteral: function NullLiteral() {},
    Hash: function Hash(hash) {
      this.acceptArray(hash.pairs);
    },
    HashPair: function HashPair(pair) {
      this.acceptRequired(pair, "value");
    }
  };
  function visitSubExpression(mustache) {
    this.acceptRequired(mustache, "path");
    this.acceptArray(mustache.params);
    this.acceptKey(mustache, "hash");
  }
  function visitBlock(block) {
    visitSubExpression.call(this, block);
    this.acceptKey(block, "program");
    this.acceptKey(block, "inverse");
  }
  function visitPartial(partial) {
    this.acceptRequired(partial, "name");
    this.acceptArray(partial.params);
    this.acceptKey(partial, "hash");
  }
  exports.default = Visitor;
  module.exports = exports["default"];
});

// node_modules/.bun/handlebars@4.7.9/node_modules/handlebars/dist/cjs/handlebars/compiler/whitespace-control.js
var require_whitespace_control = __commonJS(function(exports, module) {
  exports.__esModule = true;
  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
  }
  var _visitor = require_visitor();
  var _visitor2 = _interopRequireDefault(_visitor);
  function WhitespaceControl() {
    var options = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];
    this.options = options;
  }
  WhitespaceControl.prototype = new _visitor2["default"];
  WhitespaceControl.prototype.Program = function(program) {
    var doStandalone = !this.options.ignoreStandalone;
    var isRoot = !this.isRootSeen;
    this.isRootSeen = true;
    var body = program.body;
    for (var i = 0, l = body.length;i < l; i++) {
      var current = body[i], strip = this.accept(current);
      if (!strip) {
        continue;
      }
      var _isPrevWhitespace = isPrevWhitespace(body, i, isRoot), _isNextWhitespace = isNextWhitespace(body, i, isRoot), openStandalone = strip.openStandalone && _isPrevWhitespace, closeStandalone = strip.closeStandalone && _isNextWhitespace, inlineStandalone = strip.inlineStandalone && _isPrevWhitespace && _isNextWhitespace;
      if (strip.close) {
        omitRight(body, i, true);
      }
      if (strip.open) {
        omitLeft(body, i, true);
      }
      if (doStandalone && inlineStandalone) {
        omitRight(body, i);
        if (omitLeft(body, i)) {
          if (current.type === "PartialStatement") {
            current.indent = /([ \t]+$)/.exec(body[i - 1].original)[1];
          }
        }
      }
      if (doStandalone && openStandalone) {
        omitRight((current.program || current.inverse).body);
        omitLeft(body, i);
      }
      if (doStandalone && closeStandalone) {
        omitRight(body, i);
        omitLeft((current.inverse || current.program).body);
      }
    }
    return program;
  };
  WhitespaceControl.prototype.BlockStatement = WhitespaceControl.prototype.DecoratorBlock = WhitespaceControl.prototype.PartialBlockStatement = function(block) {
    this.accept(block.program);
    this.accept(block.inverse);
    var program = block.program || block.inverse, inverse = block.program && block.inverse, firstInverse = inverse, lastInverse = inverse;
    if (inverse && inverse.chained) {
      firstInverse = inverse.body[0].program;
      while (lastInverse.chained) {
        lastInverse = lastInverse.body[lastInverse.body.length - 1].program;
      }
    }
    var strip = {
      open: block.openStrip.open,
      close: block.closeStrip.close,
      openStandalone: isNextWhitespace(program.body),
      closeStandalone: isPrevWhitespace((firstInverse || program).body)
    };
    if (block.openStrip.close) {
      omitRight(program.body, null, true);
    }
    if (inverse) {
      var inverseStrip = block.inverseStrip;
      if (inverseStrip.open) {
        omitLeft(program.body, null, true);
      }
      if (inverseStrip.close) {
        omitRight(firstInverse.body, null, true);
      }
      if (block.closeStrip.open) {
        omitLeft(lastInverse.body, null, true);
      }
      if (!this.options.ignoreStandalone && isPrevWhitespace(program.body) && isNextWhitespace(firstInverse.body)) {
        omitLeft(program.body);
        omitRight(firstInverse.body);
      }
    } else if (block.closeStrip.open) {
      omitLeft(program.body, null, true);
    }
    return strip;
  };
  WhitespaceControl.prototype.Decorator = WhitespaceControl.prototype.MustacheStatement = function(mustache) {
    return mustache.strip;
  };
  WhitespaceControl.prototype.PartialStatement = WhitespaceControl.prototype.CommentStatement = function(node) {
    var strip = node.strip || {};
    return {
      inlineStandalone: true,
      open: strip.open,
      close: strip.close
    };
  };
  function isPrevWhitespace(body, i, isRoot) {
    if (i === undefined) {
      i = body.length;
    }
    var prev = body[i - 1], sibling = body[i - 2];
    if (!prev) {
      return isRoot;
    }
    if (prev.type === "ContentStatement") {
      return (sibling || !isRoot ? /\r?\n\s*?$/ : /(^|\r?\n)\s*?$/).test(prev.original);
    }
  }
  function isNextWhitespace(body, i, isRoot) {
    if (i === undefined) {
      i = -1;
    }
    var next = body[i + 1], sibling = body[i + 2];
    if (!next) {
      return isRoot;
    }
    if (next.type === "ContentStatement") {
      return (sibling || !isRoot ? /^\s*?\r?\n/ : /^\s*?(\r?\n|$)/).test(next.original);
    }
  }
  function omitRight(body, i, multiple) {
    var current = body[i == null ? 0 : i + 1];
    if (!current || current.type !== "ContentStatement" || !multiple && current.rightStripped) {
      return;
    }
    var original = current.value;
    current.value = current.value.replace(multiple ? /^\s+/ : /^[ \t]*\r?\n?/, "");
    current.rightStripped = current.value !== original;
  }
  function omitLeft(body, i, multiple) {
    var current = body[i == null ? body.length - 1 : i - 1];
    if (!current || current.type !== "ContentStatement" || !multiple && current.leftStripped) {
      return;
    }
    var original = current.value;
    current.value = current.value.replace(multiple ? /\s+$/ : /[ \t]+$/, "");
    current.leftStripped = current.value !== original;
    return current.leftStripped;
  }
  exports.default = WhitespaceControl;
  module.exports = exports["default"];
});

// node_modules/.bun/handlebars@4.7.9/node_modules/handlebars/dist/cjs/handlebars/compiler/helpers.js
var require_helpers2 = __commonJS(function(exports) {
  exports.__esModule = true;
  exports.SourceLocation = SourceLocation;
  exports.id = id;
  exports.stripFlags = stripFlags;
  exports.stripComment = stripComment;
  exports.preparePath = preparePath;
  exports.prepareMustache = prepareMustache;
  exports.prepareRawBlock = prepareRawBlock;
  exports.prepareBlock = prepareBlock;
  exports.prepareProgram = prepareProgram;
  exports.preparePartialBlock = preparePartialBlock;
  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
  }
  var _exception = require_exception();
  var _exception2 = _interopRequireDefault(_exception);
  function validateClose(open, close) {
    close = close.path ? close.path.original : close;
    if (open.path.original !== close) {
      var errorNode = { loc: open.path.loc };
      throw new _exception2["default"](open.path.original + " doesn't match " + close, errorNode);
    }
  }
  function SourceLocation(source, locInfo) {
    this.source = source;
    this.start = {
      line: locInfo.first_line,
      column: locInfo.first_column
    };
    this.end = {
      line: locInfo.last_line,
      column: locInfo.last_column
    };
  }
  function id(token) {
    if (/^\[.*\]$/.test(token)) {
      return token.substring(1, token.length - 1);
    } else {
      return token;
    }
  }
  function stripFlags(open, close) {
    return {
      open: open.charAt(2) === "~",
      close: close.charAt(close.length - 3) === "~"
    };
  }
  function stripComment(comment) {
    return comment.replace(/^\{\{~?!-?-?/, "").replace(/-?-?~?\}\}$/, "");
  }
  function preparePath(data, parts, loc) {
    loc = this.locInfo(loc);
    var original = data ? "@" : "", dig = [], depth = 0;
    for (var i = 0, l = parts.length;i < l; i++) {
      var part = parts[i].part, isLiteral = parts[i].original !== part;
      original += (parts[i].separator || "") + part;
      if (!isLiteral && (part === ".." || part === "." || part === "this")) {
        if (dig.length > 0) {
          throw new _exception2["default"]("Invalid path: " + original, { loc });
        } else if (part === "..") {
          depth++;
        }
      } else {
        dig.push(part);
      }
    }
    return {
      type: "PathExpression",
      data,
      depth,
      parts: dig,
      original,
      loc
    };
  }
  function prepareMustache(path, params, hash, open, strip, locInfo) {
    var escapeFlag = open.charAt(3) || open.charAt(2), escaped = escapeFlag !== "{" && escapeFlag !== "&";
    var decorator = /\*/.test(open);
    return {
      type: decorator ? "Decorator" : "MustacheStatement",
      path,
      params,
      hash,
      escaped,
      strip,
      loc: this.locInfo(locInfo)
    };
  }
  function prepareRawBlock(openRawBlock, contents, close, locInfo) {
    validateClose(openRawBlock, close);
    locInfo = this.locInfo(locInfo);
    var program = {
      type: "Program",
      body: contents,
      strip: {},
      loc: locInfo
    };
    return {
      type: "BlockStatement",
      path: openRawBlock.path,
      params: openRawBlock.params,
      hash: openRawBlock.hash,
      program,
      openStrip: {},
      inverseStrip: {},
      closeStrip: {},
      loc: locInfo
    };
  }
  function prepareBlock(openBlock, program, inverseAndProgram, close, inverted, locInfo) {
    if (close && close.path) {
      validateClose(openBlock, close);
    }
    var decorator = /\*/.test(openBlock.open);
    program.blockParams = openBlock.blockParams;
    var inverse = undefined, inverseStrip = undefined;
    if (inverseAndProgram) {
      if (decorator) {
        throw new _exception2["default"]("Unexpected inverse block on decorator", inverseAndProgram);
      }
      if (inverseAndProgram.chain) {
        inverseAndProgram.program.body[0].closeStrip = close.strip;
      }
      inverseStrip = inverseAndProgram.strip;
      inverse = inverseAndProgram.program;
    }
    if (inverted) {
      inverted = inverse;
      inverse = program;
      program = inverted;
    }
    return {
      type: decorator ? "DecoratorBlock" : "BlockStatement",
      path: openBlock.path,
      params: openBlock.params,
      hash: openBlock.hash,
      program,
      inverse,
      openStrip: openBlock.strip,
      inverseStrip,
      closeStrip: close && close.strip,
      loc: this.locInfo(locInfo)
    };
  }
  function prepareProgram(statements, loc) {
    if (!loc && statements.length) {
      var firstLoc = statements[0].loc, lastLoc = statements[statements.length - 1].loc;
      if (firstLoc && lastLoc) {
        loc = {
          source: firstLoc.source,
          start: {
            line: firstLoc.start.line,
            column: firstLoc.start.column
          },
          end: {
            line: lastLoc.end.line,
            column: lastLoc.end.column
          }
        };
      }
    }
    return {
      type: "Program",
      body: statements,
      strip: {},
      loc
    };
  }
  function preparePartialBlock(open, program, close, locInfo) {
    validateClose(open, close);
    return {
      type: "PartialBlockStatement",
      name: open.path,
      params: open.params,
      hash: open.hash,
      program,
      openStrip: open.strip,
      closeStrip: close && close.strip,
      loc: this.locInfo(locInfo)
    };
  }
});

// node_modules/.bun/handlebars@4.7.9/node_modules/handlebars/dist/cjs/handlebars/compiler/base.js
var require_base2 = __commonJS(function(exports) {
  exports.__esModule = true;
  exports.parseWithoutProcessing = parseWithoutProcessing;
  exports.parse = parse;
  function _interopRequireWildcard(obj) {
    if (obj && obj.__esModule) {
      return obj;
    } else {
      var newObj = {};
      if (obj != null) {
        for (var key in obj) {
          if (Object.prototype.hasOwnProperty.call(obj, key))
            newObj[key] = obj[key];
        }
      }
      newObj["default"] = obj;
      return newObj;
    }
  }
  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
  }
  var _parser = require_parser();
  var _parser2 = _interopRequireDefault(_parser);
  var _whitespaceControl = require_whitespace_control();
  var _whitespaceControl2 = _interopRequireDefault(_whitespaceControl);
  var _helpers = require_helpers2();
  var Helpers = _interopRequireWildcard(_helpers);
  var _exception = require_exception();
  var _exception2 = _interopRequireDefault(_exception);
  var _utils = require_utils();
  exports.parser = _parser2["default"];
  var yy = {};
  _utils.extend(yy, Helpers);
  function parseWithoutProcessing(input, options) {
    if (input.type === "Program") {
      validateInputAst(input);
      return input;
    }
    _parser2["default"].yy = yy;
    yy.locInfo = function(locInfo) {
      return new yy.SourceLocation(options && options.srcName, locInfo);
    };
    var ast = _parser2["default"].parse(input);
    return ast;
  }
  function parse(input, options) {
    var ast = parseWithoutProcessing(input, options);
    var strip = new _whitespaceControl2["default"](options);
    return strip.accept(ast);
  }
  function validateInputAst(ast) {
    validateAstNode(ast);
  }
  function validateAstNode(node) {
    if (node == null) {
      return;
    }
    if (Array.isArray(node)) {
      node.forEach(validateAstNode);
      return;
    }
    if (typeof node !== "object") {
      return;
    }
    if (node.type === "PathExpression") {
      if (!isValidDepth(node.depth)) {
        throw new _exception2["default"]("Invalid AST: PathExpression.depth must be an integer");
      }
      if (!Array.isArray(node.parts)) {
        throw new _exception2["default"]("Invalid AST: PathExpression.parts must be an array");
      }
      for (var i = 0;i < node.parts.length; i++) {
        if (typeof node.parts[i] !== "string") {
          throw new _exception2["default"]("Invalid AST: PathExpression.parts must only contain strings");
        }
      }
    } else if (node.type === "NumberLiteral") {
      if (typeof node.value !== "number" || !isFinite(node.value)) {
        throw new _exception2["default"]("Invalid AST: NumberLiteral.value must be a number");
      }
    } else if (node.type === "BooleanLiteral") {
      if (typeof node.value !== "boolean") {
        throw new _exception2["default"]("Invalid AST: BooleanLiteral.value must be a boolean");
      }
    }
    Object.keys(node).forEach(function(propertyName) {
      if (propertyName === "loc") {
        return;
      }
      validateAstNode(node[propertyName]);
    });
  }
  function isValidDepth(depth) {
    return typeof depth === "number" && isFinite(depth) && Math.floor(depth) === depth && depth >= 0;
  }
});

// node_modules/.bun/handlebars@4.7.9/node_modules/handlebars/dist/cjs/handlebars/compiler/compiler.js
var require_compiler = __commonJS(function(exports) {
  exports.__esModule = true;
  exports.Compiler = Compiler;
  exports.precompile = precompile;
  exports.compile = compile;
  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
  }
  var _exception = require_exception();
  var _exception2 = _interopRequireDefault(_exception);
  var _utils = require_utils();
  var _ast = require_ast();
  var _ast2 = _interopRequireDefault(_ast);
  var slice = [].slice;
  function Compiler() {}
  Compiler.prototype = {
    compiler: Compiler,
    equals: function equals(other) {
      var len = this.opcodes.length;
      if (other.opcodes.length !== len) {
        return false;
      }
      for (var i = 0;i < len; i++) {
        var opcode = this.opcodes[i], otherOpcode = other.opcodes[i];
        if (opcode.opcode !== otherOpcode.opcode || !argEquals(opcode.args, otherOpcode.args)) {
          return false;
        }
      }
      len = this.children.length;
      for (var i = 0;i < len; i++) {
        if (!this.children[i].equals(other.children[i])) {
          return false;
        }
      }
      return true;
    },
    guid: 0,
    compile: function compile(program, options) {
      this.sourceNode = [];
      this.opcodes = [];
      this.children = [];
      this.options = options;
      this.stringParams = options.stringParams;
      this.trackIds = options.trackIds;
      options.blockParams = options.blockParams || [];
      options.knownHelpers = _utils.extend(Object.create(null), {
        helperMissing: true,
        blockHelperMissing: true,
        each: true,
        if: true,
        unless: true,
        with: true,
        log: true,
        lookup: true
      }, options.knownHelpers);
      return this.accept(program);
    },
    compileProgram: function compileProgram(program) {
      var childCompiler = new this.compiler, result = childCompiler.compile(program, this.options), guid = this.guid++;
      this.usePartial = this.usePartial || result.usePartial;
      this.children[guid] = result;
      this.useDepths = this.useDepths || result.useDepths;
      return guid;
    },
    accept: function accept(node) {
      if (!this[node.type]) {
        throw new _exception2["default"]("Unknown type: " + node.type, node);
      }
      this.sourceNode.unshift(node);
      var ret = this[node.type](node);
      this.sourceNode.shift();
      return ret;
    },
    Program: function Program(program) {
      this.options.blockParams.unshift(program.blockParams);
      var body = program.body, bodyLength = body.length;
      for (var i = 0;i < bodyLength; i++) {
        this.accept(body[i]);
      }
      this.options.blockParams.shift();
      this.isSimple = bodyLength === 1;
      this.blockParams = program.blockParams ? program.blockParams.length : 0;
      return this;
    },
    BlockStatement: function BlockStatement(block) {
      transformLiteralToPath(block);
      var { program, inverse } = block;
      program = program && this.compileProgram(program);
      inverse = inverse && this.compileProgram(inverse);
      var type = this.classifySexpr(block);
      if (type === "helper") {
        this.helperSexpr(block, program, inverse);
      } else if (type === "simple") {
        this.simpleSexpr(block);
        this.opcode("pushProgram", program);
        this.opcode("pushProgram", inverse);
        this.opcode("emptyHash");
        this.opcode("blockValue", block.path.original);
      } else {
        this.ambiguousSexpr(block, program, inverse);
        this.opcode("pushProgram", program);
        this.opcode("pushProgram", inverse);
        this.opcode("emptyHash");
        this.opcode("ambiguousBlockValue");
      }
      this.opcode("append");
    },
    DecoratorBlock: function DecoratorBlock(decorator) {
      var program = decorator.program && this.compileProgram(decorator.program);
      var params = this.setupFullMustacheParams(decorator, program, undefined), path = decorator.path;
      this.useDecorators = true;
      this.opcode("registerDecorator", params.length, path.original);
    },
    PartialStatement: function PartialStatement(partial) {
      this.usePartial = true;
      var program = partial.program;
      if (program) {
        program = this.compileProgram(partial.program);
      }
      var params = partial.params;
      if (params.length > 1) {
        throw new _exception2["default"]("Unsupported number of partial arguments: " + params.length, partial);
      } else if (!params.length) {
        if (this.options.explicitPartialContext) {
          this.opcode("pushLiteral", "undefined");
        } else {
          params.push({ type: "PathExpression", parts: [], depth: 0 });
        }
      }
      var partialName = partial.name.original, isDynamic = partial.name.type === "SubExpression";
      if (isDynamic) {
        this.accept(partial.name);
      }
      this.setupFullMustacheParams(partial, program, undefined, true);
      var indent = partial.indent || "";
      if (this.options.preventIndent && indent) {
        this.opcode("appendContent", indent);
        indent = "";
      }
      this.opcode("invokePartial", isDynamic, partialName, indent);
      this.opcode("append");
    },
    PartialBlockStatement: function PartialBlockStatement(partialBlock) {
      this.PartialStatement(partialBlock);
    },
    MustacheStatement: function MustacheStatement(mustache) {
      this.SubExpression(mustache);
      if (mustache.escaped && !this.options.noEscape) {
        this.opcode("appendEscaped");
      } else {
        this.opcode("append");
      }
    },
    Decorator: function Decorator(decorator) {
      this.DecoratorBlock(decorator);
    },
    ContentStatement: function ContentStatement(content) {
      if (content.value) {
        this.opcode("appendContent", content.value);
      }
    },
    CommentStatement: function CommentStatement() {},
    SubExpression: function SubExpression(sexpr) {
      transformLiteralToPath(sexpr);
      var type = this.classifySexpr(sexpr);
      if (type === "simple") {
        this.simpleSexpr(sexpr);
      } else if (type === "helper") {
        this.helperSexpr(sexpr);
      } else {
        this.ambiguousSexpr(sexpr);
      }
    },
    ambiguousSexpr: function ambiguousSexpr(sexpr, program, inverse) {
      var path = sexpr.path, name = path.parts[0], isBlock = program != null || inverse != null;
      this.opcode("getContext", path.depth);
      this.opcode("pushProgram", program);
      this.opcode("pushProgram", inverse);
      path.strict = true;
      this.accept(path);
      this.opcode("invokeAmbiguous", name, isBlock);
    },
    simpleSexpr: function simpleSexpr(sexpr) {
      var path = sexpr.path;
      path.strict = true;
      this.accept(path);
      this.opcode("resolvePossibleLambda");
    },
    helperSexpr: function helperSexpr(sexpr, program, inverse) {
      var params = this.setupFullMustacheParams(sexpr, program, inverse), path = sexpr.path, name = path.parts[0];
      if (this.options.knownHelpers[name]) {
        this.opcode("invokeKnownHelper", params.length, name);
      } else if (this.options.knownHelpersOnly) {
        throw new _exception2["default"]("You specified knownHelpersOnly, but used the unknown helper " + name, sexpr);
      } else {
        path.strict = true;
        path.falsy = true;
        this.accept(path);
        this.opcode("invokeHelper", params.length, path.original, _ast2["default"].helpers.simpleId(path));
      }
    },
    PathExpression: function PathExpression(path) {
      this.addDepth(path.depth);
      this.opcode("getContext", path.depth);
      var name = path.parts[0], scoped = _ast2["default"].helpers.scopedId(path), blockParamId = !path.depth && !scoped && this.blockParamIndex(name);
      if (blockParamId) {
        this.opcode("lookupBlockParam", blockParamId, path.parts);
      } else if (!name) {
        this.opcode("pushContext");
      } else if (path.data) {
        this.options.data = true;
        this.opcode("lookupData", path.depth, path.parts, path.strict);
      } else {
        this.opcode("lookupOnContext", path.parts, path.falsy, path.strict, scoped);
      }
    },
    StringLiteral: function StringLiteral(string) {
      this.opcode("pushString", string.value);
    },
    NumberLiteral: function NumberLiteral(number) {
      this.opcode("pushLiteral", number.value);
    },
    BooleanLiteral: function BooleanLiteral(bool) {
      this.opcode("pushLiteral", bool.value);
    },
    UndefinedLiteral: function UndefinedLiteral() {
      this.opcode("pushLiteral", "undefined");
    },
    NullLiteral: function NullLiteral() {
      this.opcode("pushLiteral", "null");
    },
    Hash: function Hash(hash) {
      var pairs = hash.pairs, i = 0, l = pairs.length;
      this.opcode("pushHash");
      for (;i < l; i++) {
        this.pushParam(pairs[i].value);
      }
      while (i--) {
        this.opcode("assignToHash", pairs[i].key);
      }
      this.opcode("popHash");
    },
    opcode: function opcode(name) {
      this.opcodes.push({
        opcode: name,
        args: slice.call(arguments, 1),
        loc: this.sourceNode[0].loc
      });
    },
    addDepth: function addDepth(depth) {
      if (!depth) {
        return;
      }
      this.useDepths = true;
    },
    classifySexpr: function classifySexpr(sexpr) {
      var isSimple = _ast2["default"].helpers.simpleId(sexpr.path);
      var isBlockParam = isSimple && !!this.blockParamIndex(sexpr.path.parts[0]);
      var isHelper = !isBlockParam && _ast2["default"].helpers.helperExpression(sexpr);
      var isEligible = !isBlockParam && (isHelper || isSimple);
      if (isEligible && !isHelper) {
        var _name = sexpr.path.parts[0], options = this.options;
        if (options.knownHelpers[_name]) {
          isHelper = true;
        } else if (options.knownHelpersOnly) {
          isEligible = false;
        }
      }
      if (isHelper) {
        return "helper";
      } else if (isEligible) {
        return "ambiguous";
      } else {
        return "simple";
      }
    },
    pushParams: function pushParams(params) {
      for (var i = 0, l = params.length;i < l; i++) {
        this.pushParam(params[i]);
      }
    },
    pushParam: function pushParam(val) {
      var value = val.value != null ? val.value : val.original || "";
      if (this.stringParams) {
        if (value.replace) {
          value = value.replace(/^(\.?\.\/)*/g, "").replace(/\//g, ".");
        }
        if (val.depth) {
          this.addDepth(val.depth);
        }
        this.opcode("getContext", val.depth || 0);
        this.opcode("pushStringParam", value, val.type);
        if (val.type === "SubExpression") {
          this.accept(val);
        }
      } else {
        if (this.trackIds) {
          var blockParamIndex = undefined;
          if (val.parts && !_ast2["default"].helpers.scopedId(val) && !val.depth) {
            blockParamIndex = this.blockParamIndex(val.parts[0]);
          }
          if (blockParamIndex) {
            var blockParamChild = val.parts.slice(1).join(".");
            this.opcode("pushId", "BlockParam", blockParamIndex, blockParamChild);
          } else {
            value = val.original || value;
            if (value.replace) {
              value = value.replace(/^this(?:\.|$)/, "").replace(/^\.\//, "").replace(/^\.$/, "");
            }
            this.opcode("pushId", val.type, value);
          }
        }
        this.accept(val);
      }
    },
    setupFullMustacheParams: function setupFullMustacheParams(sexpr, program, inverse, omitEmpty) {
      var params = sexpr.params;
      this.pushParams(params);
      this.opcode("pushProgram", program);
      this.opcode("pushProgram", inverse);
      if (sexpr.hash) {
        this.accept(sexpr.hash);
      } else {
        this.opcode("emptyHash", omitEmpty);
      }
      return params;
    },
    blockParamIndex: function blockParamIndex(name) {
      for (var depth = 0, len = this.options.blockParams.length;depth < len; depth++) {
        var blockParams = this.options.blockParams[depth], param = blockParams && _utils.indexOf(blockParams, name);
        if (blockParams && param >= 0) {
          return [depth, param];
        }
      }
    }
  };
  function precompile(input, options, env) {
    if (input == null || typeof input !== "string" && input.type !== "Program") {
      throw new _exception2["default"]("You must pass a string or Handlebars AST to Handlebars.precompile. You passed " + input);
    }
    options = options || {};
    if (!("data" in options)) {
      options.data = true;
    }
    if (options.compat) {
      options.useDepths = true;
    }
    var ast = env.parse(input, options), environment = new env.Compiler().compile(ast, options);
    return new env.JavaScriptCompiler().compile(environment, options);
  }
  function compile(input, options, env) {
    if (options === undefined)
      options = {};
    if (input == null || typeof input !== "string" && input.type !== "Program") {
      throw new _exception2["default"]("You must pass a string or Handlebars AST to Handlebars.compile. You passed " + input);
    }
    options = _utils.extend({}, options);
    if (!("data" in options)) {
      options.data = true;
    }
    if (options.compat) {
      options.useDepths = true;
    }
    var compiled = undefined;
    function compileInput() {
      var ast = env.parse(input, options), environment = new env.Compiler().compile(ast, options), templateSpec = new env.JavaScriptCompiler().compile(environment, options, undefined, true);
      return env.template(templateSpec);
    }
    function ret(context, execOptions) {
      if (!compiled) {
        compiled = compileInput();
      }
      return compiled.call(this, context, execOptions);
    }
    ret._setup = function(setupOptions) {
      if (!compiled) {
        compiled = compileInput();
      }
      return compiled._setup(setupOptions);
    };
    ret._child = function(i, data, blockParams, depths) {
      if (!compiled) {
        compiled = compileInput();
      }
      return compiled._child(i, data, blockParams, depths);
    };
    return ret;
  }
  function argEquals(a, b) {
    if (a === b) {
      return true;
    }
    if (_utils.isArray(a) && _utils.isArray(b) && a.length === b.length) {
      for (var i = 0;i < a.length; i++) {
        if (!argEquals(a[i], b[i])) {
          return false;
        }
      }
      return true;
    }
  }
  function transformLiteralToPath(sexpr) {
    if (!sexpr.path.parts) {
      var literal = sexpr.path;
      sexpr.path = {
        type: "PathExpression",
        data: false,
        depth: 0,
        parts: [literal.original + ""],
        original: literal.original + "",
        loc: literal.loc
      };
    }
  }
});

// node_modules/.bun/source-map@0.6.1/node_modules/source-map/lib/base64.js
var require_base64 = __commonJS(function(exports) {
  var intToCharMap = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/".split("");
  exports.encode = function(number) {
    if (0 <= number && number < intToCharMap.length) {
      return intToCharMap[number];
    }
    throw new TypeError("Must be between 0 and 63: " + number);
  };
  exports.decode = function(charCode) {
    var bigA = 65;
    var bigZ = 90;
    var littleA = 97;
    var littleZ = 122;
    var zero = 48;
    var nine = 57;
    var plus = 43;
    var slash = 47;
    var littleOffset = 26;
    var numberOffset = 52;
    if (bigA <= charCode && charCode <= bigZ) {
      return charCode - bigA;
    }
    if (littleA <= charCode && charCode <= littleZ) {
      return charCode - littleA + littleOffset;
    }
    if (zero <= charCode && charCode <= nine) {
      return charCode - zero + numberOffset;
    }
    if (charCode == plus) {
      return 62;
    }
    if (charCode == slash) {
      return 63;
    }
    return -1;
  };
});

// node_modules/.bun/source-map@0.6.1/node_modules/source-map/lib/base64-vlq.js
var require_base64_vlq = __commonJS(function(exports) {
  var base64 = require_base64();
  var VLQ_BASE_SHIFT = 5;
  var VLQ_BASE = 1 << VLQ_BASE_SHIFT;
  var VLQ_BASE_MASK = VLQ_BASE - 1;
  var VLQ_CONTINUATION_BIT = VLQ_BASE;
  function toVLQSigned(aValue) {
    return aValue < 0 ? (-aValue << 1) + 1 : (aValue << 1) + 0;
  }
  function fromVLQSigned(aValue) {
    var isNegative = (aValue & 1) === 1;
    var shifted = aValue >> 1;
    return isNegative ? -shifted : shifted;
  }
  exports.encode = function base64VLQ_encode(aValue) {
    var encoded = "";
    var digit;
    var vlq = toVLQSigned(aValue);
    do {
      digit = vlq & VLQ_BASE_MASK;
      vlq >>>= VLQ_BASE_SHIFT;
      if (vlq > 0) {
        digit |= VLQ_CONTINUATION_BIT;
      }
      encoded += base64.encode(digit);
    } while (vlq > 0);
    return encoded;
  };
  exports.decode = function base64VLQ_decode(aStr, aIndex, aOutParam) {
    var strLen = aStr.length;
    var result = 0;
    var shift = 0;
    var continuation, digit;
    do {
      if (aIndex >= strLen) {
        throw new Error("Expected more digits in base 64 VLQ value.");
      }
      digit = base64.decode(aStr.charCodeAt(aIndex++));
      if (digit === -1) {
        throw new Error("Invalid base64 digit: " + aStr.charAt(aIndex - 1));
      }
      continuation = !!(digit & VLQ_CONTINUATION_BIT);
      digit &= VLQ_BASE_MASK;
      result = result + (digit << shift);
      shift += VLQ_BASE_SHIFT;
    } while (continuation);
    aOutParam.value = fromVLQSigned(result);
    aOutParam.rest = aIndex;
  };
});

// node_modules/.bun/source-map@0.6.1/node_modules/source-map/lib/util.js
var require_util = __commonJS(function(exports) {
  function getArg(aArgs, aName, aDefaultValue) {
    if (aName in aArgs) {
      return aArgs[aName];
    } else if (arguments.length === 3) {
      return aDefaultValue;
    } else {
      throw new Error('"' + aName + '" is a required argument.');
    }
  }
  exports.getArg = getArg;
  var urlRegexp = /^(?:([\w+\-.]+):)?\/\/(?:(\w+:\w+)@)?([\w.-]*)(?::(\d+))?(.*)$/;
  var dataUrlRegexp = /^data:.+\,.+$/;
  function urlParse(aUrl) {
    var match = aUrl.match(urlRegexp);
    if (!match) {
      return null;
    }
    return {
      scheme: match[1],
      auth: match[2],
      host: match[3],
      port: match[4],
      path: match[5]
    };
  }
  exports.urlParse = urlParse;
  function urlGenerate(aParsedUrl) {
    var url = "";
    if (aParsedUrl.scheme) {
      url += aParsedUrl.scheme + ":";
    }
    url += "//";
    if (aParsedUrl.auth) {
      url += aParsedUrl.auth + "@";
    }
    if (aParsedUrl.host) {
      url += aParsedUrl.host;
    }
    if (aParsedUrl.port) {
      url += ":" + aParsedUrl.port;
    }
    if (aParsedUrl.path) {
      url += aParsedUrl.path;
    }
    return url;
  }
  exports.urlGenerate = urlGenerate;
  function normalize(aPath) {
    var path = aPath;
    var url = urlParse(aPath);
    if (url) {
      if (!url.path) {
        return aPath;
      }
      path = url.path;
    }
    var isAbsolute = exports.isAbsolute(path);
    var parts = path.split(/\/+/);
    for (var part, up = 0, i = parts.length - 1;i >= 0; i--) {
      part = parts[i];
      if (part === ".") {
        parts.splice(i, 1);
      } else if (part === "..") {
        up++;
      } else if (up > 0) {
        if (part === "") {
          parts.splice(i + 1, up);
          up = 0;
        } else {
          parts.splice(i, 2);
          up--;
        }
      }
    }
    path = parts.join("/");
    if (path === "") {
      path = isAbsolute ? "/" : ".";
    }
    if (url) {
      url.path = path;
      return urlGenerate(url);
    }
    return path;
  }
  exports.normalize = normalize;
  function join(aRoot, aPath) {
    if (aRoot === "") {
      aRoot = ".";
    }
    if (aPath === "") {
      aPath = ".";
    }
    var aPathUrl = urlParse(aPath);
    var aRootUrl = urlParse(aRoot);
    if (aRootUrl) {
      aRoot = aRootUrl.path || "/";
    }
    if (aPathUrl && !aPathUrl.scheme) {
      if (aRootUrl) {
        aPathUrl.scheme = aRootUrl.scheme;
      }
      return urlGenerate(aPathUrl);
    }
    if (aPathUrl || aPath.match(dataUrlRegexp)) {
      return aPath;
    }
    if (aRootUrl && !aRootUrl.host && !aRootUrl.path) {
      aRootUrl.host = aPath;
      return urlGenerate(aRootUrl);
    }
    var joined = aPath.charAt(0) === "/" ? aPath : normalize(aRoot.replace(/\/+$/, "") + "/" + aPath);
    if (aRootUrl) {
      aRootUrl.path = joined;
      return urlGenerate(aRootUrl);
    }
    return joined;
  }
  exports.join = join;
  exports.isAbsolute = function(aPath) {
    return aPath.charAt(0) === "/" || urlRegexp.test(aPath);
  };
  function relative(aRoot, aPath) {
    if (aRoot === "") {
      aRoot = ".";
    }
    aRoot = aRoot.replace(/\/$/, "");
    var level = 0;
    while (aPath.indexOf(aRoot + "/") !== 0) {
      var index = aRoot.lastIndexOf("/");
      if (index < 0) {
        return aPath;
      }
      aRoot = aRoot.slice(0, index);
      if (aRoot.match(/^([^\/]+:\/)?\/*$/)) {
        return aPath;
      }
      ++level;
    }
    return Array(level + 1).join("../") + aPath.substr(aRoot.length + 1);
  }
  exports.relative = relative;
  var supportsNullProto = function() {
    var obj = Object.create(null);
    return !("__proto__" in obj);
  }();
  function identity(s) {
    return s;
  }
  function toSetString(aStr) {
    if (isProtoString(aStr)) {
      return "$" + aStr;
    }
    return aStr;
  }
  exports.toSetString = supportsNullProto ? identity : toSetString;
  function fromSetString(aStr) {
    if (isProtoString(aStr)) {
      return aStr.slice(1);
    }
    return aStr;
  }
  exports.fromSetString = supportsNullProto ? identity : fromSetString;
  function isProtoString(s) {
    if (!s) {
      return false;
    }
    var length = s.length;
    if (length < 9) {
      return false;
    }
    if (s.charCodeAt(length - 1) !== 95 || s.charCodeAt(length - 2) !== 95 || s.charCodeAt(length - 3) !== 111 || s.charCodeAt(length - 4) !== 116 || s.charCodeAt(length - 5) !== 111 || s.charCodeAt(length - 6) !== 114 || s.charCodeAt(length - 7) !== 112 || s.charCodeAt(length - 8) !== 95 || s.charCodeAt(length - 9) !== 95) {
      return false;
    }
    for (var i = length - 10;i >= 0; i--) {
      if (s.charCodeAt(i) !== 36) {
        return false;
      }
    }
    return true;
  }
  function compareByOriginalPositions(mappingA, mappingB, onlyCompareOriginal) {
    var cmp = strcmp(mappingA.source, mappingB.source);
    if (cmp !== 0) {
      return cmp;
    }
    cmp = mappingA.originalLine - mappingB.originalLine;
    if (cmp !== 0) {
      return cmp;
    }
    cmp = mappingA.originalColumn - mappingB.originalColumn;
    if (cmp !== 0 || onlyCompareOriginal) {
      return cmp;
    }
    cmp = mappingA.generatedColumn - mappingB.generatedColumn;
    if (cmp !== 0) {
      return cmp;
    }
    cmp = mappingA.generatedLine - mappingB.generatedLine;
    if (cmp !== 0) {
      return cmp;
    }
    return strcmp(mappingA.name, mappingB.name);
  }
  exports.compareByOriginalPositions = compareByOriginalPositions;
  function compareByGeneratedPositionsDeflated(mappingA, mappingB, onlyCompareGenerated) {
    var cmp = mappingA.generatedLine - mappingB.generatedLine;
    if (cmp !== 0) {
      return cmp;
    }
    cmp = mappingA.generatedColumn - mappingB.generatedColumn;
    if (cmp !== 0 || onlyCompareGenerated) {
      return cmp;
    }
    cmp = strcmp(mappingA.source, mappingB.source);
    if (cmp !== 0) {
      return cmp;
    }
    cmp = mappingA.originalLine - mappingB.originalLine;
    if (cmp !== 0) {
      return cmp;
    }
    cmp = mappingA.originalColumn - mappingB.originalColumn;
    if (cmp !== 0) {
      return cmp;
    }
    return strcmp(mappingA.name, mappingB.name);
  }
  exports.compareByGeneratedPositionsDeflated = compareByGeneratedPositionsDeflated;
  function strcmp(aStr1, aStr2) {
    if (aStr1 === aStr2) {
      return 0;
    }
    if (aStr1 === null) {
      return 1;
    }
    if (aStr2 === null) {
      return -1;
    }
    if (aStr1 > aStr2) {
      return 1;
    }
    return -1;
  }
  function compareByGeneratedPositionsInflated(mappingA, mappingB) {
    var cmp = mappingA.generatedLine - mappingB.generatedLine;
    if (cmp !== 0) {
      return cmp;
    }
    cmp = mappingA.generatedColumn - mappingB.generatedColumn;
    if (cmp !== 0) {
      return cmp;
    }
    cmp = strcmp(mappingA.source, mappingB.source);
    if (cmp !== 0) {
      return cmp;
    }
    cmp = mappingA.originalLine - mappingB.originalLine;
    if (cmp !== 0) {
      return cmp;
    }
    cmp = mappingA.originalColumn - mappingB.originalColumn;
    if (cmp !== 0) {
      return cmp;
    }
    return strcmp(mappingA.name, mappingB.name);
  }
  exports.compareByGeneratedPositionsInflated = compareByGeneratedPositionsInflated;
  function parseSourceMapInput(str) {
    return JSON.parse(str.replace(/^\)]}'[^\n]*\n/, ""));
  }
  exports.parseSourceMapInput = parseSourceMapInput;
  function computeSourceURL(sourceRoot, sourceURL, sourceMapURL) {
    sourceURL = sourceURL || "";
    if (sourceRoot) {
      if (sourceRoot[sourceRoot.length - 1] !== "/" && sourceURL[0] !== "/") {
        sourceRoot += "/";
      }
      sourceURL = sourceRoot + sourceURL;
    }
    if (sourceMapURL) {
      var parsed = urlParse(sourceMapURL);
      if (!parsed) {
        throw new Error("sourceMapURL could not be parsed");
      }
      if (parsed.path) {
        var index = parsed.path.lastIndexOf("/");
        if (index >= 0) {
          parsed.path = parsed.path.substring(0, index + 1);
        }
      }
      sourceURL = join(urlGenerate(parsed), sourceURL);
    }
    return normalize(sourceURL);
  }
  exports.computeSourceURL = computeSourceURL;
});

// node_modules/.bun/source-map@0.6.1/node_modules/source-map/lib/array-set.js
var require_array_set = __commonJS(function(exports) {
  var util = require_util();
  var has = Object.prototype.hasOwnProperty;
  var hasNativeMap = typeof Map !== "undefined";
  function ArraySet() {
    this._array = [];
    this._set = hasNativeMap ? new Map : Object.create(null);
  }
  ArraySet.fromArray = function ArraySet_fromArray(aArray, aAllowDuplicates) {
    var set = new ArraySet;
    for (var i = 0, len = aArray.length;i < len; i++) {
      set.add(aArray[i], aAllowDuplicates);
    }
    return set;
  };
  ArraySet.prototype.size = function ArraySet_size() {
    return hasNativeMap ? this._set.size : Object.getOwnPropertyNames(this._set).length;
  };
  ArraySet.prototype.add = function ArraySet_add(aStr, aAllowDuplicates) {
    var sStr = hasNativeMap ? aStr : util.toSetString(aStr);
    var isDuplicate = hasNativeMap ? this.has(aStr) : has.call(this._set, sStr);
    var idx = this._array.length;
    if (!isDuplicate || aAllowDuplicates) {
      this._array.push(aStr);
    }
    if (!isDuplicate) {
      if (hasNativeMap) {
        this._set.set(aStr, idx);
      } else {
        this._set[sStr] = idx;
      }
    }
  };
  ArraySet.prototype.has = function ArraySet_has(aStr) {
    if (hasNativeMap) {
      return this._set.has(aStr);
    } else {
      var sStr = util.toSetString(aStr);
      return has.call(this._set, sStr);
    }
  };
  ArraySet.prototype.indexOf = function ArraySet_indexOf(aStr) {
    if (hasNativeMap) {
      var idx = this._set.get(aStr);
      if (idx >= 0) {
        return idx;
      }
    } else {
      var sStr = util.toSetString(aStr);
      if (has.call(this._set, sStr)) {
        return this._set[sStr];
      }
    }
    throw new Error('"' + aStr + '" is not in the set.');
  };
  ArraySet.prototype.at = function ArraySet_at(aIdx) {
    if (aIdx >= 0 && aIdx < this._array.length) {
      return this._array[aIdx];
    }
    throw new Error("No element indexed by " + aIdx);
  };
  ArraySet.prototype.toArray = function ArraySet_toArray() {
    return this._array.slice();
  };
  exports.ArraySet = ArraySet;
});

// node_modules/.bun/source-map@0.6.1/node_modules/source-map/lib/mapping-list.js
var require_mapping_list = __commonJS(function(exports) {
  var util = require_util();
  function generatedPositionAfter(mappingA, mappingB) {
    var lineA = mappingA.generatedLine;
    var lineB = mappingB.generatedLine;
    var columnA = mappingA.generatedColumn;
    var columnB = mappingB.generatedColumn;
    return lineB > lineA || lineB == lineA && columnB >= columnA || util.compareByGeneratedPositionsInflated(mappingA, mappingB) <= 0;
  }
  function MappingList() {
    this._array = [];
    this._sorted = true;
    this._last = { generatedLine: -1, generatedColumn: 0 };
  }
  MappingList.prototype.unsortedForEach = function MappingList_forEach(aCallback, aThisArg) {
    this._array.forEach(aCallback, aThisArg);
  };
  MappingList.prototype.add = function MappingList_add(aMapping) {
    if (generatedPositionAfter(this._last, aMapping)) {
      this._last = aMapping;
      this._array.push(aMapping);
    } else {
      this._sorted = false;
      this._array.push(aMapping);
    }
  };
  MappingList.prototype.toArray = function MappingList_toArray() {
    if (!this._sorted) {
      this._array.sort(util.compareByGeneratedPositionsInflated);
      this._sorted = true;
    }
    return this._array;
  };
  exports.MappingList = MappingList;
});

// node_modules/.bun/source-map@0.6.1/node_modules/source-map/lib/source-map-generator.js
var require_source_map_generator = __commonJS(function(exports) {
  var base64VLQ = require_base64_vlq();
  var util = require_util();
  var ArraySet = require_array_set().ArraySet;
  var MappingList = require_mapping_list().MappingList;
  function SourceMapGenerator(aArgs) {
    if (!aArgs) {
      aArgs = {};
    }
    this._file = util.getArg(aArgs, "file", null);
    this._sourceRoot = util.getArg(aArgs, "sourceRoot", null);
    this._skipValidation = util.getArg(aArgs, "skipValidation", false);
    this._sources = new ArraySet;
    this._names = new ArraySet;
    this._mappings = new MappingList;
    this._sourcesContents = null;
  }
  SourceMapGenerator.prototype._version = 3;
  SourceMapGenerator.fromSourceMap = function SourceMapGenerator_fromSourceMap(aSourceMapConsumer) {
    var sourceRoot = aSourceMapConsumer.sourceRoot;
    var generator = new SourceMapGenerator({
      file: aSourceMapConsumer.file,
      sourceRoot
    });
    aSourceMapConsumer.eachMapping(function(mapping) {
      var newMapping = {
        generated: {
          line: mapping.generatedLine,
          column: mapping.generatedColumn
        }
      };
      if (mapping.source != null) {
        newMapping.source = mapping.source;
        if (sourceRoot != null) {
          newMapping.source = util.relative(sourceRoot, newMapping.source);
        }
        newMapping.original = {
          line: mapping.originalLine,
          column: mapping.originalColumn
        };
        if (mapping.name != null) {
          newMapping.name = mapping.name;
        }
      }
      generator.addMapping(newMapping);
    });
    aSourceMapConsumer.sources.forEach(function(sourceFile) {
      var sourceRelative = sourceFile;
      if (sourceRoot !== null) {
        sourceRelative = util.relative(sourceRoot, sourceFile);
      }
      if (!generator._sources.has(sourceRelative)) {
        generator._sources.add(sourceRelative);
      }
      var content = aSourceMapConsumer.sourceContentFor(sourceFile);
      if (content != null) {
        generator.setSourceContent(sourceFile, content);
      }
    });
    return generator;
  };
  SourceMapGenerator.prototype.addMapping = function SourceMapGenerator_addMapping(aArgs) {
    var generated = util.getArg(aArgs, "generated");
    var original = util.getArg(aArgs, "original", null);
    var source = util.getArg(aArgs, "source", null);
    var name = util.getArg(aArgs, "name", null);
    if (!this._skipValidation) {
      this._validateMapping(generated, original, source, name);
    }
    if (source != null) {
      source = String(source);
      if (!this._sources.has(source)) {
        this._sources.add(source);
      }
    }
    if (name != null) {
      name = String(name);
      if (!this._names.has(name)) {
        this._names.add(name);
      }
    }
    this._mappings.add({
      generatedLine: generated.line,
      generatedColumn: generated.column,
      originalLine: original != null && original.line,
      originalColumn: original != null && original.column,
      source,
      name
    });
  };
  SourceMapGenerator.prototype.setSourceContent = function SourceMapGenerator_setSourceContent(aSourceFile, aSourceContent) {
    var source = aSourceFile;
    if (this._sourceRoot != null) {
      source = util.relative(this._sourceRoot, source);
    }
    if (aSourceContent != null) {
      if (!this._sourcesContents) {
        this._sourcesContents = Object.create(null);
      }
      this._sourcesContents[util.toSetString(source)] = aSourceContent;
    } else if (this._sourcesContents) {
      delete this._sourcesContents[util.toSetString(source)];
      if (Object.keys(this._sourcesContents).length === 0) {
        this._sourcesContents = null;
      }
    }
  };
  SourceMapGenerator.prototype.applySourceMap = function SourceMapGenerator_applySourceMap(aSourceMapConsumer, aSourceFile, aSourceMapPath) {
    var sourceFile = aSourceFile;
    if (aSourceFile == null) {
      if (aSourceMapConsumer.file == null) {
        throw new Error("SourceMapGenerator.prototype.applySourceMap requires either an explicit source file, " + `or the source map's "file" property. Both were omitted.`);
      }
      sourceFile = aSourceMapConsumer.file;
    }
    var sourceRoot = this._sourceRoot;
    if (sourceRoot != null) {
      sourceFile = util.relative(sourceRoot, sourceFile);
    }
    var newSources = new ArraySet;
    var newNames = new ArraySet;
    this._mappings.unsortedForEach(function(mapping) {
      if (mapping.source === sourceFile && mapping.originalLine != null) {
        var original = aSourceMapConsumer.originalPositionFor({
          line: mapping.originalLine,
          column: mapping.originalColumn
        });
        if (original.source != null) {
          mapping.source = original.source;
          if (aSourceMapPath != null) {
            mapping.source = util.join(aSourceMapPath, mapping.source);
          }
          if (sourceRoot != null) {
            mapping.source = util.relative(sourceRoot, mapping.source);
          }
          mapping.originalLine = original.line;
          mapping.originalColumn = original.column;
          if (original.name != null) {
            mapping.name = original.name;
          }
        }
      }
      var source = mapping.source;
      if (source != null && !newSources.has(source)) {
        newSources.add(source);
      }
      var name = mapping.name;
      if (name != null && !newNames.has(name)) {
        newNames.add(name);
      }
    }, this);
    this._sources = newSources;
    this._names = newNames;
    aSourceMapConsumer.sources.forEach(function(sourceFile) {
      var content = aSourceMapConsumer.sourceContentFor(sourceFile);
      if (content != null) {
        if (aSourceMapPath != null) {
          sourceFile = util.join(aSourceMapPath, sourceFile);
        }
        if (sourceRoot != null) {
          sourceFile = util.relative(sourceRoot, sourceFile);
        }
        this.setSourceContent(sourceFile, content);
      }
    }, this);
  };
  SourceMapGenerator.prototype._validateMapping = function SourceMapGenerator_validateMapping(aGenerated, aOriginal, aSource, aName) {
    if (aOriginal && typeof aOriginal.line !== "number" && typeof aOriginal.column !== "number") {
      throw new Error("original.line and original.column are not numbers -- you probably meant to omit " + "the original mapping entirely and only map the generated position. If so, pass " + "null for the original mapping instead of an object with empty or null values.");
    }
    if (aGenerated && "line" in aGenerated && "column" in aGenerated && aGenerated.line > 0 && aGenerated.column >= 0 && !aOriginal && !aSource && !aName) {
      return;
    } else if (aGenerated && "line" in aGenerated && "column" in aGenerated && aOriginal && "line" in aOriginal && "column" in aOriginal && aGenerated.line > 0 && aGenerated.column >= 0 && aOriginal.line > 0 && aOriginal.column >= 0 && aSource) {
      return;
    } else {
      throw new Error("Invalid mapping: " + JSON.stringify({
        generated: aGenerated,
        source: aSource,
        original: aOriginal,
        name: aName
      }));
    }
  };
  SourceMapGenerator.prototype._serializeMappings = function SourceMapGenerator_serializeMappings() {
    var previousGeneratedColumn = 0;
    var previousGeneratedLine = 1;
    var previousOriginalColumn = 0;
    var previousOriginalLine = 0;
    var previousName = 0;
    var previousSource = 0;
    var result = "";
    var next;
    var mapping;
    var nameIdx;
    var sourceIdx;
    var mappings = this._mappings.toArray();
    for (var i = 0, len = mappings.length;i < len; i++) {
      mapping = mappings[i];
      next = "";
      if (mapping.generatedLine !== previousGeneratedLine) {
        previousGeneratedColumn = 0;
        while (mapping.generatedLine !== previousGeneratedLine) {
          next += ";";
          previousGeneratedLine++;
        }
      } else {
        if (i > 0) {
          if (!util.compareByGeneratedPositionsInflated(mapping, mappings[i - 1])) {
            continue;
          }
          next += ",";
        }
      }
      next += base64VLQ.encode(mapping.generatedColumn - previousGeneratedColumn);
      previousGeneratedColumn = mapping.generatedColumn;
      if (mapping.source != null) {
        sourceIdx = this._sources.indexOf(mapping.source);
        next += base64VLQ.encode(sourceIdx - previousSource);
        previousSource = sourceIdx;
        next += base64VLQ.encode(mapping.originalLine - 1 - previousOriginalLine);
        previousOriginalLine = mapping.originalLine - 1;
        next += base64VLQ.encode(mapping.originalColumn - previousOriginalColumn);
        previousOriginalColumn = mapping.originalColumn;
        if (mapping.name != null) {
          nameIdx = this._names.indexOf(mapping.name);
          next += base64VLQ.encode(nameIdx - previousName);
          previousName = nameIdx;
        }
      }
      result += next;
    }
    return result;
  };
  SourceMapGenerator.prototype._generateSourcesContent = function SourceMapGenerator_generateSourcesContent(aSources, aSourceRoot) {
    return aSources.map(function(source) {
      if (!this._sourcesContents) {
        return null;
      }
      if (aSourceRoot != null) {
        source = util.relative(aSourceRoot, source);
      }
      var key = util.toSetString(source);
      return Object.prototype.hasOwnProperty.call(this._sourcesContents, key) ? this._sourcesContents[key] : null;
    }, this);
  };
  SourceMapGenerator.prototype.toJSON = function SourceMapGenerator_toJSON() {
    var map = {
      version: this._version,
      sources: this._sources.toArray(),
      names: this._names.toArray(),
      mappings: this._serializeMappings()
    };
    if (this._file != null) {
      map.file = this._file;
    }
    if (this._sourceRoot != null) {
      map.sourceRoot = this._sourceRoot;
    }
    if (this._sourcesContents) {
      map.sourcesContent = this._generateSourcesContent(map.sources, map.sourceRoot);
    }
    return map;
  };
  SourceMapGenerator.prototype.toString = function SourceMapGenerator_toString() {
    return JSON.stringify(this.toJSON());
  };
  exports.SourceMapGenerator = SourceMapGenerator;
});

// node_modules/.bun/source-map@0.6.1/node_modules/source-map/lib/binary-search.js
var require_binary_search = __commonJS(function(exports) {
  exports.GREATEST_LOWER_BOUND = 1;
  exports.LEAST_UPPER_BOUND = 2;
  function recursiveSearch(aLow, aHigh, aNeedle, aHaystack, aCompare, aBias) {
    var mid = Math.floor((aHigh - aLow) / 2) + aLow;
    var cmp = aCompare(aNeedle, aHaystack[mid], true);
    if (cmp === 0) {
      return mid;
    } else if (cmp > 0) {
      if (aHigh - mid > 1) {
        return recursiveSearch(mid, aHigh, aNeedle, aHaystack, aCompare, aBias);
      }
      if (aBias == exports.LEAST_UPPER_BOUND) {
        return aHigh < aHaystack.length ? aHigh : -1;
      } else {
        return mid;
      }
    } else {
      if (mid - aLow > 1) {
        return recursiveSearch(aLow, mid, aNeedle, aHaystack, aCompare, aBias);
      }
      if (aBias == exports.LEAST_UPPER_BOUND) {
        return mid;
      } else {
        return aLow < 0 ? -1 : aLow;
      }
    }
  }
  exports.search = function search(aNeedle, aHaystack, aCompare, aBias) {
    if (aHaystack.length === 0) {
      return -1;
    }
    var index = recursiveSearch(-1, aHaystack.length, aNeedle, aHaystack, aCompare, aBias || exports.GREATEST_LOWER_BOUND);
    if (index < 0) {
      return -1;
    }
    while (index - 1 >= 0) {
      if (aCompare(aHaystack[index], aHaystack[index - 1], true) !== 0) {
        break;
      }
      --index;
    }
    return index;
  };
});

// node_modules/.bun/source-map@0.6.1/node_modules/source-map/lib/quick-sort.js
var require_quick_sort = __commonJS(function(exports) {
  function swap(ary, x, y) {
    var temp = ary[x];
    ary[x] = ary[y];
    ary[y] = temp;
  }
  function randomIntInRange(low, high) {
    return Math.round(low + Math.random() * (high - low));
  }
  function doQuickSort(ary, comparator, p, r) {
    if (p < r) {
      var pivotIndex = randomIntInRange(p, r);
      var i = p - 1;
      swap(ary, pivotIndex, r);
      var pivot = ary[r];
      for (var j = p;j < r; j++) {
        if (comparator(ary[j], pivot) <= 0) {
          i += 1;
          swap(ary, i, j);
        }
      }
      swap(ary, i + 1, j);
      var q = i + 1;
      doQuickSort(ary, comparator, p, q - 1);
      doQuickSort(ary, comparator, q + 1, r);
    }
  }
  exports.quickSort = function(ary, comparator) {
    doQuickSort(ary, comparator, 0, ary.length - 1);
  };
});

// node_modules/.bun/source-map@0.6.1/node_modules/source-map/lib/source-map-consumer.js
var require_source_map_consumer = __commonJS(function(exports) {
  var util = require_util();
  var binarySearch = require_binary_search();
  var ArraySet = require_array_set().ArraySet;
  var base64VLQ = require_base64_vlq();
  var quickSort = require_quick_sort().quickSort;
  function SourceMapConsumer(aSourceMap, aSourceMapURL) {
    var sourceMap = aSourceMap;
    if (typeof aSourceMap === "string") {
      sourceMap = util.parseSourceMapInput(aSourceMap);
    }
    return sourceMap.sections != null ? new IndexedSourceMapConsumer(sourceMap, aSourceMapURL) : new BasicSourceMapConsumer(sourceMap, aSourceMapURL);
  }
  SourceMapConsumer.fromSourceMap = function(aSourceMap, aSourceMapURL) {
    return BasicSourceMapConsumer.fromSourceMap(aSourceMap, aSourceMapURL);
  };
  SourceMapConsumer.prototype._version = 3;
  SourceMapConsumer.prototype.__generatedMappings = null;
  Object.defineProperty(SourceMapConsumer.prototype, "_generatedMappings", {
    configurable: true,
    enumerable: true,
    get: function() {
      if (!this.__generatedMappings) {
        this._parseMappings(this._mappings, this.sourceRoot);
      }
      return this.__generatedMappings;
    }
  });
  SourceMapConsumer.prototype.__originalMappings = null;
  Object.defineProperty(SourceMapConsumer.prototype, "_originalMappings", {
    configurable: true,
    enumerable: true,
    get: function() {
      if (!this.__originalMappings) {
        this._parseMappings(this._mappings, this.sourceRoot);
      }
      return this.__originalMappings;
    }
  });
  SourceMapConsumer.prototype._charIsMappingSeparator = function SourceMapConsumer_charIsMappingSeparator(aStr, index) {
    var c = aStr.charAt(index);
    return c === ";" || c === ",";
  };
  SourceMapConsumer.prototype._parseMappings = function SourceMapConsumer_parseMappings(aStr, aSourceRoot) {
    throw new Error("Subclasses must implement _parseMappings");
  };
  SourceMapConsumer.GENERATED_ORDER = 1;
  SourceMapConsumer.ORIGINAL_ORDER = 2;
  SourceMapConsumer.GREATEST_LOWER_BOUND = 1;
  SourceMapConsumer.LEAST_UPPER_BOUND = 2;
  SourceMapConsumer.prototype.eachMapping = function SourceMapConsumer_eachMapping(aCallback, aContext, aOrder) {
    var context = aContext || null;
    var order = aOrder || SourceMapConsumer.GENERATED_ORDER;
    var mappings;
    switch (order) {
      case SourceMapConsumer.GENERATED_ORDER:
        mappings = this._generatedMappings;
        break;
      case SourceMapConsumer.ORIGINAL_ORDER:
        mappings = this._originalMappings;
        break;
      default:
        throw new Error("Unknown order of iteration.");
    }
    var sourceRoot = this.sourceRoot;
    mappings.map(function(mapping) {
      var source = mapping.source === null ? null : this._sources.at(mapping.source);
      source = util.computeSourceURL(sourceRoot, source, this._sourceMapURL);
      return {
        source,
        generatedLine: mapping.generatedLine,
        generatedColumn: mapping.generatedColumn,
        originalLine: mapping.originalLine,
        originalColumn: mapping.originalColumn,
        name: mapping.name === null ? null : this._names.at(mapping.name)
      };
    }, this).forEach(aCallback, context);
  };
  SourceMapConsumer.prototype.allGeneratedPositionsFor = function SourceMapConsumer_allGeneratedPositionsFor(aArgs) {
    var line = util.getArg(aArgs, "line");
    var needle = {
      source: util.getArg(aArgs, "source"),
      originalLine: line,
      originalColumn: util.getArg(aArgs, "column", 0)
    };
    needle.source = this._findSourceIndex(needle.source);
    if (needle.source < 0) {
      return [];
    }
    var mappings = [];
    var index = this._findMapping(needle, this._originalMappings, "originalLine", "originalColumn", util.compareByOriginalPositions, binarySearch.LEAST_UPPER_BOUND);
    if (index >= 0) {
      var mapping = this._originalMappings[index];
      if (aArgs.column === undefined) {
        var originalLine = mapping.originalLine;
        while (mapping && mapping.originalLine === originalLine) {
          mappings.push({
            line: util.getArg(mapping, "generatedLine", null),
            column: util.getArg(mapping, "generatedColumn", null),
            lastColumn: util.getArg(mapping, "lastGeneratedColumn", null)
          });
          mapping = this._originalMappings[++index];
        }
      } else {
        var originalColumn = mapping.originalColumn;
        while (mapping && mapping.originalLine === line && mapping.originalColumn == originalColumn) {
          mappings.push({
            line: util.getArg(mapping, "generatedLine", null),
            column: util.getArg(mapping, "generatedColumn", null),
            lastColumn: util.getArg(mapping, "lastGeneratedColumn", null)
          });
          mapping = this._originalMappings[++index];
        }
      }
    }
    return mappings;
  };
  exports.SourceMapConsumer = SourceMapConsumer;
  function BasicSourceMapConsumer(aSourceMap, aSourceMapURL) {
    var sourceMap = aSourceMap;
    if (typeof aSourceMap === "string") {
      sourceMap = util.parseSourceMapInput(aSourceMap);
    }
    var version = util.getArg(sourceMap, "version");
    var sources = util.getArg(sourceMap, "sources");
    var names = util.getArg(sourceMap, "names", []);
    var sourceRoot = util.getArg(sourceMap, "sourceRoot", null);
    var sourcesContent = util.getArg(sourceMap, "sourcesContent", null);
    var mappings = util.getArg(sourceMap, "mappings");
    var file = util.getArg(sourceMap, "file", null);
    if (version != this._version) {
      throw new Error("Unsupported version: " + version);
    }
    if (sourceRoot) {
      sourceRoot = util.normalize(sourceRoot);
    }
    sources = sources.map(String).map(util.normalize).map(function(source) {
      return sourceRoot && util.isAbsolute(sourceRoot) && util.isAbsolute(source) ? util.relative(sourceRoot, source) : source;
    });
    this._names = ArraySet.fromArray(names.map(String), true);
    this._sources = ArraySet.fromArray(sources, true);
    this._absoluteSources = this._sources.toArray().map(function(s) {
      return util.computeSourceURL(sourceRoot, s, aSourceMapURL);
    });
    this.sourceRoot = sourceRoot;
    this.sourcesContent = sourcesContent;
    this._mappings = mappings;
    this._sourceMapURL = aSourceMapURL;
    this.file = file;
  }
  BasicSourceMapConsumer.prototype = Object.create(SourceMapConsumer.prototype);
  BasicSourceMapConsumer.prototype.consumer = SourceMapConsumer;
  BasicSourceMapConsumer.prototype._findSourceIndex = function(aSource) {
    var relativeSource = aSource;
    if (this.sourceRoot != null) {
      relativeSource = util.relative(this.sourceRoot, relativeSource);
    }
    if (this._sources.has(relativeSource)) {
      return this._sources.indexOf(relativeSource);
    }
    var i;
    for (i = 0;i < this._absoluteSources.length; ++i) {
      if (this._absoluteSources[i] == aSource) {
        return i;
      }
    }
    return -1;
  };
  BasicSourceMapConsumer.fromSourceMap = function SourceMapConsumer_fromSourceMap(aSourceMap, aSourceMapURL) {
    var smc = Object.create(BasicSourceMapConsumer.prototype);
    var names = smc._names = ArraySet.fromArray(aSourceMap._names.toArray(), true);
    var sources = smc._sources = ArraySet.fromArray(aSourceMap._sources.toArray(), true);
    smc.sourceRoot = aSourceMap._sourceRoot;
    smc.sourcesContent = aSourceMap._generateSourcesContent(smc._sources.toArray(), smc.sourceRoot);
    smc.file = aSourceMap._file;
    smc._sourceMapURL = aSourceMapURL;
    smc._absoluteSources = smc._sources.toArray().map(function(s) {
      return util.computeSourceURL(smc.sourceRoot, s, aSourceMapURL);
    });
    var generatedMappings = aSourceMap._mappings.toArray().slice();
    var destGeneratedMappings = smc.__generatedMappings = [];
    var destOriginalMappings = smc.__originalMappings = [];
    for (var i = 0, length = generatedMappings.length;i < length; i++) {
      var srcMapping = generatedMappings[i];
      var destMapping = new Mapping;
      destMapping.generatedLine = srcMapping.generatedLine;
      destMapping.generatedColumn = srcMapping.generatedColumn;
      if (srcMapping.source) {
        destMapping.source = sources.indexOf(srcMapping.source);
        destMapping.originalLine = srcMapping.originalLine;
        destMapping.originalColumn = srcMapping.originalColumn;
        if (srcMapping.name) {
          destMapping.name = names.indexOf(srcMapping.name);
        }
        destOriginalMappings.push(destMapping);
      }
      destGeneratedMappings.push(destMapping);
    }
    quickSort(smc.__originalMappings, util.compareByOriginalPositions);
    return smc;
  };
  BasicSourceMapConsumer.prototype._version = 3;
  Object.defineProperty(BasicSourceMapConsumer.prototype, "sources", {
    get: function() {
      return this._absoluteSources.slice();
    }
  });
  function Mapping() {
    this.generatedLine = 0;
    this.generatedColumn = 0;
    this.source = null;
    this.originalLine = null;
    this.originalColumn = null;
    this.name = null;
  }
  BasicSourceMapConsumer.prototype._parseMappings = function SourceMapConsumer_parseMappings(aStr, aSourceRoot) {
    var generatedLine = 1;
    var previousGeneratedColumn = 0;
    var previousOriginalLine = 0;
    var previousOriginalColumn = 0;
    var previousSource = 0;
    var previousName = 0;
    var length = aStr.length;
    var index = 0;
    var cachedSegments = {};
    var temp = {};
    var originalMappings = [];
    var generatedMappings = [];
    var mapping, str, segment, end, value;
    while (index < length) {
      if (aStr.charAt(index) === ";") {
        generatedLine++;
        index++;
        previousGeneratedColumn = 0;
      } else if (aStr.charAt(index) === ",") {
        index++;
      } else {
        mapping = new Mapping;
        mapping.generatedLine = generatedLine;
        for (end = index;end < length; end++) {
          if (this._charIsMappingSeparator(aStr, end)) {
            break;
          }
        }
        str = aStr.slice(index, end);
        segment = cachedSegments[str];
        if (segment) {
          index += str.length;
        } else {
          segment = [];
          while (index < end) {
            base64VLQ.decode(aStr, index, temp);
            value = temp.value;
            index = temp.rest;
            segment.push(value);
          }
          if (segment.length === 2) {
            throw new Error("Found a source, but no line and column");
          }
          if (segment.length === 3) {
            throw new Error("Found a source and line, but no column");
          }
          cachedSegments[str] = segment;
        }
        mapping.generatedColumn = previousGeneratedColumn + segment[0];
        previousGeneratedColumn = mapping.generatedColumn;
        if (segment.length > 1) {
          mapping.source = previousSource + segment[1];
          previousSource += segment[1];
          mapping.originalLine = previousOriginalLine + segment[2];
          previousOriginalLine = mapping.originalLine;
          mapping.originalLine += 1;
          mapping.originalColumn = previousOriginalColumn + segment[3];
          previousOriginalColumn = mapping.originalColumn;
          if (segment.length > 4) {
            mapping.name = previousName + segment[4];
            previousName += segment[4];
          }
        }
        generatedMappings.push(mapping);
        if (typeof mapping.originalLine === "number") {
          originalMappings.push(mapping);
        }
      }
    }
    quickSort(generatedMappings, util.compareByGeneratedPositionsDeflated);
    this.__generatedMappings = generatedMappings;
    quickSort(originalMappings, util.compareByOriginalPositions);
    this.__originalMappings = originalMappings;
  };
  BasicSourceMapConsumer.prototype._findMapping = function SourceMapConsumer_findMapping(aNeedle, aMappings, aLineName, aColumnName, aComparator, aBias) {
    if (aNeedle[aLineName] <= 0) {
      throw new TypeError("Line must be greater than or equal to 1, got " + aNeedle[aLineName]);
    }
    if (aNeedle[aColumnName] < 0) {
      throw new TypeError("Column must be greater than or equal to 0, got " + aNeedle[aColumnName]);
    }
    return binarySearch.search(aNeedle, aMappings, aComparator, aBias);
  };
  BasicSourceMapConsumer.prototype.computeColumnSpans = function SourceMapConsumer_computeColumnSpans() {
    for (var index = 0;index < this._generatedMappings.length; ++index) {
      var mapping = this._generatedMappings[index];
      if (index + 1 < this._generatedMappings.length) {
        var nextMapping = this._generatedMappings[index + 1];
        if (mapping.generatedLine === nextMapping.generatedLine) {
          mapping.lastGeneratedColumn = nextMapping.generatedColumn - 1;
          continue;
        }
      }
      mapping.lastGeneratedColumn = Infinity;
    }
  };
  BasicSourceMapConsumer.prototype.originalPositionFor = function SourceMapConsumer_originalPositionFor(aArgs) {
    var needle = {
      generatedLine: util.getArg(aArgs, "line"),
      generatedColumn: util.getArg(aArgs, "column")
    };
    var index = this._findMapping(needle, this._generatedMappings, "generatedLine", "generatedColumn", util.compareByGeneratedPositionsDeflated, util.getArg(aArgs, "bias", SourceMapConsumer.GREATEST_LOWER_BOUND));
    if (index >= 0) {
      var mapping = this._generatedMappings[index];
      if (mapping.generatedLine === needle.generatedLine) {
        var source = util.getArg(mapping, "source", null);
        if (source !== null) {
          source = this._sources.at(source);
          source = util.computeSourceURL(this.sourceRoot, source, this._sourceMapURL);
        }
        var name = util.getArg(mapping, "name", null);
        if (name !== null) {
          name = this._names.at(name);
        }
        return {
          source,
          line: util.getArg(mapping, "originalLine", null),
          column: util.getArg(mapping, "originalColumn", null),
          name
        };
      }
    }
    return {
      source: null,
      line: null,
      column: null,
      name: null
    };
  };
  BasicSourceMapConsumer.prototype.hasContentsOfAllSources = function BasicSourceMapConsumer_hasContentsOfAllSources() {
    if (!this.sourcesContent) {
      return false;
    }
    return this.sourcesContent.length >= this._sources.size() && !this.sourcesContent.some(function(sc) {
      return sc == null;
    });
  };
  BasicSourceMapConsumer.prototype.sourceContentFor = function SourceMapConsumer_sourceContentFor(aSource, nullOnMissing) {
    if (!this.sourcesContent) {
      return null;
    }
    var index = this._findSourceIndex(aSource);
    if (index >= 0) {
      return this.sourcesContent[index];
    }
    var relativeSource = aSource;
    if (this.sourceRoot != null) {
      relativeSource = util.relative(this.sourceRoot, relativeSource);
    }
    var url;
    if (this.sourceRoot != null && (url = util.urlParse(this.sourceRoot))) {
      var fileUriAbsPath = relativeSource.replace(/^file:\/\//, "");
      if (url.scheme == "file" && this._sources.has(fileUriAbsPath)) {
        return this.sourcesContent[this._sources.indexOf(fileUriAbsPath)];
      }
      if ((!url.path || url.path == "/") && this._sources.has("/" + relativeSource)) {
        return this.sourcesContent[this._sources.indexOf("/" + relativeSource)];
      }
    }
    if (nullOnMissing) {
      return null;
    } else {
      throw new Error('"' + relativeSource + '" is not in the SourceMap.');
    }
  };
  BasicSourceMapConsumer.prototype.generatedPositionFor = function SourceMapConsumer_generatedPositionFor(aArgs) {
    var source = util.getArg(aArgs, "source");
    source = this._findSourceIndex(source);
    if (source < 0) {
      return {
        line: null,
        column: null,
        lastColumn: null
      };
    }
    var needle = {
      source,
      originalLine: util.getArg(aArgs, "line"),
      originalColumn: util.getArg(aArgs, "column")
    };
    var index = this._findMapping(needle, this._originalMappings, "originalLine", "originalColumn", util.compareByOriginalPositions, util.getArg(aArgs, "bias", SourceMapConsumer.GREATEST_LOWER_BOUND));
    if (index >= 0) {
      var mapping = this._originalMappings[index];
      if (mapping.source === needle.source) {
        return {
          line: util.getArg(mapping, "generatedLine", null),
          column: util.getArg(mapping, "generatedColumn", null),
          lastColumn: util.getArg(mapping, "lastGeneratedColumn", null)
        };
      }
    }
    return {
      line: null,
      column: null,
      lastColumn: null
    };
  };
  exports.BasicSourceMapConsumer = BasicSourceMapConsumer;
  function IndexedSourceMapConsumer(aSourceMap, aSourceMapURL) {
    var sourceMap = aSourceMap;
    if (typeof aSourceMap === "string") {
      sourceMap = util.parseSourceMapInput(aSourceMap);
    }
    var version = util.getArg(sourceMap, "version");
    var sections = util.getArg(sourceMap, "sections");
    if (version != this._version) {
      throw new Error("Unsupported version: " + version);
    }
    this._sources = new ArraySet;
    this._names = new ArraySet;
    var lastOffset = {
      line: -1,
      column: 0
    };
    this._sections = sections.map(function(s) {
      if (s.url) {
        throw new Error("Support for url field in sections not implemented.");
      }
      var offset = util.getArg(s, "offset");
      var offsetLine = util.getArg(offset, "line");
      var offsetColumn = util.getArg(offset, "column");
      if (offsetLine < lastOffset.line || offsetLine === lastOffset.line && offsetColumn < lastOffset.column) {
        throw new Error("Section offsets must be ordered and non-overlapping.");
      }
      lastOffset = offset;
      return {
        generatedOffset: {
          generatedLine: offsetLine + 1,
          generatedColumn: offsetColumn + 1
        },
        consumer: new SourceMapConsumer(util.getArg(s, "map"), aSourceMapURL)
      };
    });
  }
  IndexedSourceMapConsumer.prototype = Object.create(SourceMapConsumer.prototype);
  IndexedSourceMapConsumer.prototype.constructor = SourceMapConsumer;
  IndexedSourceMapConsumer.prototype._version = 3;
  Object.defineProperty(IndexedSourceMapConsumer.prototype, "sources", {
    get: function() {
      var sources = [];
      for (var i = 0;i < this._sections.length; i++) {
        for (var j = 0;j < this._sections[i].consumer.sources.length; j++) {
          sources.push(this._sections[i].consumer.sources[j]);
        }
      }
      return sources;
    }
  });
  IndexedSourceMapConsumer.prototype.originalPositionFor = function IndexedSourceMapConsumer_originalPositionFor(aArgs) {
    var needle = {
      generatedLine: util.getArg(aArgs, "line"),
      generatedColumn: util.getArg(aArgs, "column")
    };
    var sectionIndex = binarySearch.search(needle, this._sections, function(needle, section) {
      var cmp = needle.generatedLine - section.generatedOffset.generatedLine;
      if (cmp) {
        return cmp;
      }
      return needle.generatedColumn - section.generatedOffset.generatedColumn;
    });
    var section = this._sections[sectionIndex];
    if (!section) {
      return {
        source: null,
        line: null,
        column: null,
        name: null
      };
    }
    return section.consumer.originalPositionFor({
      line: needle.generatedLine - (section.generatedOffset.generatedLine - 1),
      column: needle.generatedColumn - (section.generatedOffset.generatedLine === needle.generatedLine ? section.generatedOffset.generatedColumn - 1 : 0),
      bias: aArgs.bias
    });
  };
  IndexedSourceMapConsumer.prototype.hasContentsOfAllSources = function IndexedSourceMapConsumer_hasContentsOfAllSources() {
    return this._sections.every(function(s) {
      return s.consumer.hasContentsOfAllSources();
    });
  };
  IndexedSourceMapConsumer.prototype.sourceContentFor = function IndexedSourceMapConsumer_sourceContentFor(aSource, nullOnMissing) {
    for (var i = 0;i < this._sections.length; i++) {
      var section = this._sections[i];
      var content = section.consumer.sourceContentFor(aSource, true);
      if (content) {
        return content;
      }
    }
    if (nullOnMissing) {
      return null;
    } else {
      throw new Error('"' + aSource + '" is not in the SourceMap.');
    }
  };
  IndexedSourceMapConsumer.prototype.generatedPositionFor = function IndexedSourceMapConsumer_generatedPositionFor(aArgs) {
    for (var i = 0;i < this._sections.length; i++) {
      var section = this._sections[i];
      if (section.consumer._findSourceIndex(util.getArg(aArgs, "source")) === -1) {
        continue;
      }
      var generatedPosition = section.consumer.generatedPositionFor(aArgs);
      if (generatedPosition) {
        var ret = {
          line: generatedPosition.line + (section.generatedOffset.generatedLine - 1),
          column: generatedPosition.column + (section.generatedOffset.generatedLine === generatedPosition.line ? section.generatedOffset.generatedColumn - 1 : 0)
        };
        return ret;
      }
    }
    return {
      line: null,
      column: null
    };
  };
  IndexedSourceMapConsumer.prototype._parseMappings = function IndexedSourceMapConsumer_parseMappings(aStr, aSourceRoot) {
    this.__generatedMappings = [];
    this.__originalMappings = [];
    for (var i = 0;i < this._sections.length; i++) {
      var section = this._sections[i];
      var sectionMappings = section.consumer._generatedMappings;
      for (var j = 0;j < sectionMappings.length; j++) {
        var mapping = sectionMappings[j];
        var source = section.consumer._sources.at(mapping.source);
        source = util.computeSourceURL(section.consumer.sourceRoot, source, this._sourceMapURL);
        this._sources.add(source);
        source = this._sources.indexOf(source);
        var name = null;
        if (mapping.name) {
          name = section.consumer._names.at(mapping.name);
          this._names.add(name);
          name = this._names.indexOf(name);
        }
        var adjustedMapping = {
          source,
          generatedLine: mapping.generatedLine + (section.generatedOffset.generatedLine - 1),
          generatedColumn: mapping.generatedColumn + (section.generatedOffset.generatedLine === mapping.generatedLine ? section.generatedOffset.generatedColumn - 1 : 0),
          originalLine: mapping.originalLine,
          originalColumn: mapping.originalColumn,
          name
        };
        this.__generatedMappings.push(adjustedMapping);
        if (typeof adjustedMapping.originalLine === "number") {
          this.__originalMappings.push(adjustedMapping);
        }
      }
    }
    quickSort(this.__generatedMappings, util.compareByGeneratedPositionsDeflated);
    quickSort(this.__originalMappings, util.compareByOriginalPositions);
  };
  exports.IndexedSourceMapConsumer = IndexedSourceMapConsumer;
});

// node_modules/.bun/source-map@0.6.1/node_modules/source-map/lib/source-node.js
var require_source_node = __commonJS(function(exports) {
  var SourceMapGenerator = require_source_map_generator().SourceMapGenerator;
  var util = require_util();
  var REGEX_NEWLINE = /(\r?\n)/;
  var NEWLINE_CODE = 10;
  var isSourceNode = "$$$isSourceNode$$$";
  function SourceNode(aLine, aColumn, aSource, aChunks, aName) {
    this.children = [];
    this.sourceContents = {};
    this.line = aLine == null ? null : aLine;
    this.column = aColumn == null ? null : aColumn;
    this.source = aSource == null ? null : aSource;
    this.name = aName == null ? null : aName;
    this[isSourceNode] = true;
    if (aChunks != null)
      this.add(aChunks);
  }
  SourceNode.fromStringWithSourceMap = function SourceNode_fromStringWithSourceMap(aGeneratedCode, aSourceMapConsumer, aRelativePath) {
    var node = new SourceNode;
    var remainingLines = aGeneratedCode.split(REGEX_NEWLINE);
    var remainingLinesIndex = 0;
    var shiftNextLine = function() {
      var lineContents = getNextLine();
      var newLine = getNextLine() || "";
      return lineContents + newLine;
      function getNextLine() {
        return remainingLinesIndex < remainingLines.length ? remainingLines[remainingLinesIndex++] : undefined;
      }
    };
    var lastGeneratedLine = 1, lastGeneratedColumn = 0;
    var lastMapping = null;
    aSourceMapConsumer.eachMapping(function(mapping) {
      if (lastMapping !== null) {
        if (lastGeneratedLine < mapping.generatedLine) {
          addMappingWithCode(lastMapping, shiftNextLine());
          lastGeneratedLine++;
          lastGeneratedColumn = 0;
        } else {
          var nextLine = remainingLines[remainingLinesIndex] || "";
          var code = nextLine.substr(0, mapping.generatedColumn - lastGeneratedColumn);
          remainingLines[remainingLinesIndex] = nextLine.substr(mapping.generatedColumn - lastGeneratedColumn);
          lastGeneratedColumn = mapping.generatedColumn;
          addMappingWithCode(lastMapping, code);
          lastMapping = mapping;
          return;
        }
      }
      while (lastGeneratedLine < mapping.generatedLine) {
        node.add(shiftNextLine());
        lastGeneratedLine++;
      }
      if (lastGeneratedColumn < mapping.generatedColumn) {
        var nextLine = remainingLines[remainingLinesIndex] || "";
        node.add(nextLine.substr(0, mapping.generatedColumn));
        remainingLines[remainingLinesIndex] = nextLine.substr(mapping.generatedColumn);
        lastGeneratedColumn = mapping.generatedColumn;
      }
      lastMapping = mapping;
    }, this);
    if (remainingLinesIndex < remainingLines.length) {
      if (lastMapping) {
        addMappingWithCode(lastMapping, shiftNextLine());
      }
      node.add(remainingLines.splice(remainingLinesIndex).join(""));
    }
    aSourceMapConsumer.sources.forEach(function(sourceFile) {
      var content = aSourceMapConsumer.sourceContentFor(sourceFile);
      if (content != null) {
        if (aRelativePath != null) {
          sourceFile = util.join(aRelativePath, sourceFile);
        }
        node.setSourceContent(sourceFile, content);
      }
    });
    return node;
    function addMappingWithCode(mapping, code) {
      if (mapping === null || mapping.source === undefined) {
        node.add(code);
      } else {
        var source = aRelativePath ? util.join(aRelativePath, mapping.source) : mapping.source;
        node.add(new SourceNode(mapping.originalLine, mapping.originalColumn, source, code, mapping.name));
      }
    }
  };
  SourceNode.prototype.add = function SourceNode_add(aChunk) {
    if (Array.isArray(aChunk)) {
      aChunk.forEach(function(chunk) {
        this.add(chunk);
      }, this);
    } else if (aChunk[isSourceNode] || typeof aChunk === "string") {
      if (aChunk) {
        this.children.push(aChunk);
      }
    } else {
      throw new TypeError("Expected a SourceNode, string, or an array of SourceNodes and strings. Got " + aChunk);
    }
    return this;
  };
  SourceNode.prototype.prepend = function SourceNode_prepend(aChunk) {
    if (Array.isArray(aChunk)) {
      for (var i = aChunk.length - 1;i >= 0; i--) {
        this.prepend(aChunk[i]);
      }
    } else if (aChunk[isSourceNode] || typeof aChunk === "string") {
      this.children.unshift(aChunk);
    } else {
      throw new TypeError("Expected a SourceNode, string, or an array of SourceNodes and strings. Got " + aChunk);
    }
    return this;
  };
  SourceNode.prototype.walk = function SourceNode_walk(aFn) {
    var chunk;
    for (var i = 0, len = this.children.length;i < len; i++) {
      chunk = this.children[i];
      if (chunk[isSourceNode]) {
        chunk.walk(aFn);
      } else {
        if (chunk !== "") {
          aFn(chunk, {
            source: this.source,
            line: this.line,
            column: this.column,
            name: this.name
          });
        }
      }
    }
  };
  SourceNode.prototype.join = function SourceNode_join(aSep) {
    var newChildren;
    var i;
    var len = this.children.length;
    if (len > 0) {
      newChildren = [];
      for (i = 0;i < len - 1; i++) {
        newChildren.push(this.children[i]);
        newChildren.push(aSep);
      }
      newChildren.push(this.children[i]);
      this.children = newChildren;
    }
    return this;
  };
  SourceNode.prototype.replaceRight = function SourceNode_replaceRight(aPattern, aReplacement) {
    var lastChild = this.children[this.children.length - 1];
    if (lastChild[isSourceNode]) {
      lastChild.replaceRight(aPattern, aReplacement);
    } else if (typeof lastChild === "string") {
      this.children[this.children.length - 1] = lastChild.replace(aPattern, aReplacement);
    } else {
      this.children.push("".replace(aPattern, aReplacement));
    }
    return this;
  };
  SourceNode.prototype.setSourceContent = function SourceNode_setSourceContent(aSourceFile, aSourceContent) {
    this.sourceContents[util.toSetString(aSourceFile)] = aSourceContent;
  };
  SourceNode.prototype.walkSourceContents = function SourceNode_walkSourceContents(aFn) {
    for (var i = 0, len = this.children.length;i < len; i++) {
      if (this.children[i][isSourceNode]) {
        this.children[i].walkSourceContents(aFn);
      }
    }
    var sources = Object.keys(this.sourceContents);
    for (var i = 0, len = sources.length;i < len; i++) {
      aFn(util.fromSetString(sources[i]), this.sourceContents[sources[i]]);
    }
  };
  SourceNode.prototype.toString = function SourceNode_toString() {
    var str = "";
    this.walk(function(chunk) {
      str += chunk;
    });
    return str;
  };
  SourceNode.prototype.toStringWithSourceMap = function SourceNode_toStringWithSourceMap(aArgs) {
    var generated = {
      code: "",
      line: 1,
      column: 0
    };
    var map = new SourceMapGenerator(aArgs);
    var sourceMappingActive = false;
    var lastOriginalSource = null;
    var lastOriginalLine = null;
    var lastOriginalColumn = null;
    var lastOriginalName = null;
    this.walk(function(chunk, original) {
      generated.code += chunk;
      if (original.source !== null && original.line !== null && original.column !== null) {
        if (lastOriginalSource !== original.source || lastOriginalLine !== original.line || lastOriginalColumn !== original.column || lastOriginalName !== original.name) {
          map.addMapping({
            source: original.source,
            original: {
              line: original.line,
              column: original.column
            },
            generated: {
              line: generated.line,
              column: generated.column
            },
            name: original.name
          });
        }
        lastOriginalSource = original.source;
        lastOriginalLine = original.line;
        lastOriginalColumn = original.column;
        lastOriginalName = original.name;
        sourceMappingActive = true;
      } else if (sourceMappingActive) {
        map.addMapping({
          generated: {
            line: generated.line,
            column: generated.column
          }
        });
        lastOriginalSource = null;
        sourceMappingActive = false;
      }
      for (var idx = 0, length = chunk.length;idx < length; idx++) {
        if (chunk.charCodeAt(idx) === NEWLINE_CODE) {
          generated.line++;
          generated.column = 0;
          if (idx + 1 === length) {
            lastOriginalSource = null;
            sourceMappingActive = false;
          } else if (sourceMappingActive) {
            map.addMapping({
              source: original.source,
              original: {
                line: original.line,
                column: original.column
              },
              generated: {
                line: generated.line,
                column: generated.column
              },
              name: original.name
            });
          }
        } else {
          generated.column++;
        }
      }
    });
    this.walkSourceContents(function(sourceFile, sourceContent) {
      map.setSourceContent(sourceFile, sourceContent);
    });
    return { code: generated.code, map };
  };
  exports.SourceNode = SourceNode;
});

// node_modules/.bun/source-map@0.6.1/node_modules/source-map/source-map.js
var require_source_map = __commonJS(function(exports) {
  exports.SourceMapGenerator = require_source_map_generator().SourceMapGenerator;
  exports.SourceMapConsumer = require_source_map_consumer().SourceMapConsumer;
  exports.SourceNode = require_source_node().SourceNode;
});

// node_modules/.bun/handlebars@4.7.9/node_modules/handlebars/dist/cjs/handlebars/compiler/code-gen.js
var require_code_gen = __commonJS(function(exports, module) {
  exports.__esModule = true;
  var _utils = require_utils();
  var SourceNode = undefined;
  try {
    if (typeof define !== "function" || !define.amd) {
      SourceMap = require_source_map();
      SourceNode = SourceMap.SourceNode;
    }
  } catch (err) {}
  var SourceMap;
  if (!SourceNode) {
    SourceNode = function(line, column, srcFile, chunks) {
      this.src = "";
      if (chunks) {
        this.add(chunks);
      }
    };
    SourceNode.prototype = {
      add: function add(chunks) {
        if (_utils.isArray(chunks)) {
          chunks = chunks.join("");
        }
        this.src += chunks;
      },
      prepend: function prepend(chunks) {
        if (_utils.isArray(chunks)) {
          chunks = chunks.join("");
        }
        this.src = chunks + this.src;
      },
      toStringWithSourceMap: function toStringWithSourceMap() {
        return { code: this.toString() };
      },
      toString: function toString() {
        return this.src;
      }
    };
  }
  function castChunk(chunk, codeGen, loc) {
    if (_utils.isArray(chunk)) {
      var ret = [];
      for (var i = 0, len = chunk.length;i < len; i++) {
        ret.push(codeGen.wrap(chunk[i], loc));
      }
      return ret;
    } else if (typeof chunk === "boolean" || typeof chunk === "number") {
      return chunk + "";
    }
    return chunk;
  }
  function CodeGen(srcFile) {
    this.srcFile = srcFile;
    this.source = [];
  }
  CodeGen.prototype = {
    isEmpty: function isEmpty() {
      return !this.source.length;
    },
    prepend: function prepend(source, loc) {
      this.source.unshift(this.wrap(source, loc));
    },
    push: function push(source, loc) {
      this.source.push(this.wrap(source, loc));
    },
    merge: function merge() {
      var source = this.empty();
      this.each(function(line) {
        source.add(["  ", line, `
`]);
      });
      return source;
    },
    each: function each(iter) {
      for (var i = 0, len = this.source.length;i < len; i++) {
        iter(this.source[i]);
      }
    },
    empty: function empty() {
      var loc = this.currentLocation || { start: {} };
      return new SourceNode(loc.start.line, loc.start.column, this.srcFile);
    },
    wrap: function wrap(chunk) {
      var loc = arguments.length <= 1 || arguments[1] === undefined ? this.currentLocation || { start: {} } : arguments[1];
      if (chunk instanceof SourceNode) {
        return chunk;
      }
      chunk = castChunk(chunk, this, loc);
      return new SourceNode(loc.start.line, loc.start.column, this.srcFile, chunk);
    },
    functionCall: function functionCall(fn, type, params) {
      params = this.generateList(params);
      return this.wrap([fn, type ? "." + type + "(" : "(", params, ")"]);
    },
    quotedString: function quotedString(str) {
      return '"' + (str + "").replace(/\\/g, "\\\\").replace(/"/g, "\\\"").replace(/\n/g, "\\n").replace(/\r/g, "\\r").replace(/\u2028/g, "\\u2028").replace(/\u2029/g, "\\u2029") + '"';
    },
    objectLiteral: function objectLiteral(obj) {
      var _this = this;
      var pairs = [];
      Object.keys(obj).forEach(function(key) {
        var value = castChunk(obj[key], _this);
        if (value !== "undefined") {
          pairs.push([_this.quotedString(key), ":", value]);
        }
      });
      var ret = this.generateList(pairs);
      ret.prepend("{");
      ret.add("}");
      return ret;
    },
    generateList: function generateList(entries) {
      var ret = this.empty();
      for (var i = 0, len = entries.length;i < len; i++) {
        if (i) {
          ret.add(",");
        }
        ret.add(castChunk(entries[i], this));
      }
      return ret;
    },
    generateArray: function generateArray(entries) {
      var ret = this.generateList(entries);
      ret.prepend("[");
      ret.add("]");
      return ret;
    }
  };
  exports.default = CodeGen;
  module.exports = exports["default"];
});

// node_modules/.bun/handlebars@4.7.9/node_modules/handlebars/dist/cjs/handlebars/compiler/javascript-compiler.js
var require_javascript_compiler = __commonJS(function(exports, module) {
  exports.__esModule = true;
  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
  }
  var _base = require_base();
  var _exception = require_exception();
  var _exception2 = _interopRequireDefault(_exception);
  var _utils = require_utils();
  var _codeGen = require_code_gen();
  var _codeGen2 = _interopRequireDefault(_codeGen);
  function Literal(value) {
    this.value = value;
  }
  function JavaScriptCompiler() {}
  JavaScriptCompiler.prototype = {
    nameLookup: function nameLookup(parent, name) {
      return this.internalNameLookup(parent, name);
    },
    depthedLookup: function depthedLookup(name) {
      return [this.aliasable("container.lookup"), "(depths, ", JSON.stringify(name), ")"];
    },
    compilerInfo: function compilerInfo() {
      var revision = _base.COMPILER_REVISION, versions = _base.REVISION_CHANGES[revision];
      return [revision, versions];
    },
    appendToBuffer: function appendToBuffer(source, location, explicit) {
      if (!_utils.isArray(source)) {
        source = [source];
      }
      source = this.source.wrap(source, location);
      if (this.environment.isSimple) {
        return ["return ", source, ";"];
      } else if (explicit) {
        return ["buffer += ", source, ";"];
      } else {
        source.appendToBuffer = true;
        return source;
      }
    },
    initializeBuffer: function initializeBuffer() {
      return this.quotedString("");
    },
    internalNameLookup: function internalNameLookup(parent, name) {
      this.lookupPropertyFunctionIsUsed = true;
      return ["lookupProperty(", parent, ",", JSON.stringify(name), ")"];
    },
    lookupPropertyFunctionIsUsed: false,
    compile: function compile(environment, options, context, asObject) {
      this.environment = environment;
      this.options = options;
      this.stringParams = this.options.stringParams;
      this.trackIds = this.options.trackIds;
      this.precompile = !asObject;
      this.name = this.environment.name;
      this.isChild = !!context;
      this.context = context || {
        decorators: [],
        programs: [],
        environments: []
      };
      this.preamble();
      this.stackSlot = 0;
      this.stackVars = [];
      this.aliases = {};
      this.registers = { list: [] };
      this.hashes = [];
      this.compileStack = [];
      this.inlineStack = [];
      this.blockParams = [];
      this.compileChildren(environment, options);
      this.useDepths = this.useDepths || environment.useDepths || environment.useDecorators || this.options.compat;
      this.useBlockParams = this.useBlockParams || environment.useBlockParams;
      var opcodes = environment.opcodes, opcode = undefined, firstLoc = undefined, i = undefined, l = undefined;
      for (i = 0, l = opcodes.length;i < l; i++) {
        opcode = opcodes[i];
        this.source.currentLocation = opcode.loc;
        firstLoc = firstLoc || opcode.loc;
        this[opcode.opcode].apply(this, opcode.args);
      }
      this.source.currentLocation = firstLoc;
      this.pushSource("");
      if (this.stackSlot || this.inlineStack.length || this.compileStack.length) {
        throw new _exception2["default"]("Compile completed with content left on stack");
      }
      if (!this.decorators.isEmpty()) {
        this.useDecorators = true;
        this.decorators.prepend(["var decorators = container.decorators, ", this.lookupPropertyFunctionVarDeclaration(), `;
`]);
        this.decorators.push("return fn;");
        if (asObject) {
          this.decorators = Function.apply(this, ["fn", "props", "container", "depth0", "data", "blockParams", "depths", this.decorators.merge()]);
        } else {
          this.decorators.prepend(`function(fn, props, container, depth0, data, blockParams, depths) {
`);
          this.decorators.push(`}
`);
          this.decorators = this.decorators.merge();
        }
      } else {
        this.decorators = undefined;
      }
      var fn = this.createFunctionContext(asObject);
      if (!this.isChild) {
        var ret = {
          compiler: this.compilerInfo(),
          main: fn
        };
        if (this.decorators) {
          ret.main_d = this.decorators;
          ret.useDecorators = true;
        }
        var _context = this.context;
        var programs = _context.programs;
        var decorators = _context.decorators;
        for (i = 0, l = programs.length;i < l; i++) {
          ret[i] = programs[i];
          if (decorators[i]) {
            ret[i + "_d"] = decorators[i];
            ret.useDecorators = true;
          }
        }
        if (this.environment.usePartial) {
          ret.usePartial = true;
        }
        if (this.options.data) {
          ret.useData = true;
        }
        if (this.useDepths) {
          ret.useDepths = true;
        }
        if (this.useBlockParams) {
          ret.useBlockParams = true;
        }
        if (this.options.compat) {
          ret.compat = true;
        }
        if (!asObject) {
          ret.compiler = JSON.stringify(ret.compiler);
          this.source.currentLocation = { start: { line: 1, column: 0 } };
          ret = this.objectLiteral(ret);
          if (options.srcName) {
            ret = ret.toStringWithSourceMap({ file: options.destName });
            ret.map = ret.map && ret.map.toString();
          } else {
            ret = ret.toString();
          }
        } else {
          ret.compilerOptions = this.options;
        }
        return ret;
      } else {
        return fn;
      }
    },
    preamble: function preamble() {
      this.lastContext = 0;
      this.source = new _codeGen2["default"](this.options.srcName);
      this.decorators = new _codeGen2["default"](this.options.srcName);
    },
    createFunctionContext: function createFunctionContext(asObject) {
      var _this = this;
      var varDeclarations = "";
      var locals = this.stackVars.concat(this.registers.list);
      if (locals.length > 0) {
        varDeclarations += ", " + locals.join(", ");
      }
      var aliasCount = 0;
      Object.keys(this.aliases).forEach(function(alias) {
        var node = _this.aliases[alias];
        if (node.children && node.referenceCount > 1) {
          varDeclarations += ", alias" + ++aliasCount + "=" + alias;
          node.children[0] = "alias" + aliasCount;
        }
      });
      if (this.lookupPropertyFunctionIsUsed) {
        varDeclarations += ", " + this.lookupPropertyFunctionVarDeclaration();
      }
      var params = ["container", "depth0", "helpers", "partials", "data"];
      if (this.useBlockParams || this.useDepths) {
        params.push("blockParams");
      }
      if (this.useDepths) {
        params.push("depths");
      }
      var source = this.mergeSource(varDeclarations);
      if (asObject) {
        params.push(source);
        return Function.apply(this, params);
      } else {
        return this.source.wrap(["function(", params.join(","), `) {
  `, source, "}"]);
      }
    },
    mergeSource: function mergeSource(varDeclarations) {
      var isSimple = this.environment.isSimple, appendOnly = !this.forceBuffer, appendFirst = undefined, sourceSeen = undefined, bufferStart = undefined, bufferEnd = undefined;
      this.source.each(function(line) {
        if (line.appendToBuffer) {
          if (bufferStart) {
            line.prepend("  + ");
          } else {
            bufferStart = line;
          }
          bufferEnd = line;
        } else {
          if (bufferStart) {
            if (!sourceSeen) {
              appendFirst = true;
            } else {
              bufferStart.prepend("buffer += ");
            }
            bufferEnd.add(";");
            bufferStart = bufferEnd = undefined;
          }
          sourceSeen = true;
          if (!isSimple) {
            appendOnly = false;
          }
        }
      });
      if (appendOnly) {
        if (bufferStart) {
          bufferStart.prepend("return ");
          bufferEnd.add(";");
        } else if (!sourceSeen) {
          this.source.push('return "";');
        }
      } else {
        varDeclarations += ", buffer = " + (appendFirst ? "" : this.initializeBuffer());
        if (bufferStart) {
          bufferStart.prepend("return buffer + ");
          bufferEnd.add(";");
        } else {
          this.source.push("return buffer;");
        }
      }
      if (varDeclarations) {
        this.source.prepend("var " + varDeclarations.substring(2) + (appendFirst ? "" : `;
`));
      }
      return this.source.merge();
    },
    lookupPropertyFunctionVarDeclaration: function lookupPropertyFunctionVarDeclaration() {
      return `
      lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    }
    `.trim();
    },
    blockValue: function blockValue(name) {
      var blockHelperMissing = this.aliasable("container.hooks.blockHelperMissing"), params = [this.contextName(0)];
      this.setupHelperArgs(name, 0, params);
      var blockName = this.popStack();
      params.splice(1, 0, blockName);
      this.push(this.source.functionCall(blockHelperMissing, "call", params));
    },
    ambiguousBlockValue: function ambiguousBlockValue() {
      var blockHelperMissing = this.aliasable("container.hooks.blockHelperMissing"), params = [this.contextName(0)];
      this.setupHelperArgs("", 0, params, true);
      this.flushInline();
      var current = this.topStack();
      params.splice(1, 0, current);
      this.pushSource(["if (!", this.lastHelper, ") { ", current, " = ", this.source.functionCall(blockHelperMissing, "call", params), "}"]);
    },
    appendContent: function appendContent(content) {
      if (this.pendingContent) {
        content = this.pendingContent + content;
      } else {
        this.pendingLocation = this.source.currentLocation;
      }
      this.pendingContent = content;
    },
    append: function append() {
      if (this.isInline()) {
        this.replaceStack(function(current) {
          return [" != null ? ", current, ' : ""'];
        });
        this.pushSource(this.appendToBuffer(this.popStack()));
      } else {
        var local = this.popStack();
        this.pushSource(["if (", local, " != null) { ", this.appendToBuffer(local, undefined, true), " }"]);
        if (this.environment.isSimple) {
          this.pushSource(["else { ", this.appendToBuffer("''", undefined, true), " }"]);
        }
      }
    },
    appendEscaped: function appendEscaped() {
      this.pushSource(this.appendToBuffer([this.aliasable("container.escapeExpression"), "(", this.popStack(), ")"]));
    },
    getContext: function getContext(depth) {
      this.lastContext = depth;
    },
    pushContext: function pushContext() {
      this.pushStackLiteral(this.contextName(this.lastContext));
    },
    lookupOnContext: function lookupOnContext(parts, falsy, strict, scoped) {
      var i = 0;
      if (!scoped && this.options.compat && !this.lastContext) {
        this.push(this.depthedLookup(parts[i++]));
      } else {
        this.pushContext();
      }
      this.resolvePath("context", parts, i, falsy, strict);
    },
    lookupBlockParam: function lookupBlockParam(blockParamId, parts) {
      this.useBlockParams = true;
      this.push(["blockParams[", blockParamId[0], "][", blockParamId[1], "]"]);
      this.resolvePath("context", parts, 1);
    },
    lookupData: function lookupData(depth, parts, strict) {
      if (!depth) {
        this.pushStackLiteral("data");
      } else {
        this.pushStackLiteral("container.data(data, " + depth + ")");
      }
      this.resolvePath("data", parts, 0, true, strict);
    },
    resolvePath: function resolvePath(type, parts, startPartIndex, falsy, strict) {
      var _this2 = this;
      if (this.options.strict || this.options.assumeObjects) {
        this.push(strictLookup(this.options.strict && strict, this, parts, startPartIndex, type));
        return;
      }
      var len = parts.length;
      var _loop = function(i) {
        _this2.replaceStack(function(current) {
          var lookup = _this2.nameLookup(current, parts[i], type);
          if (!falsy) {
            return [" != null ? ", lookup, " : ", current];
          } else {
            return [" && ", lookup];
          }
        });
      };
      for (var i = startPartIndex;i < len; i++) {
        _loop(i);
      }
    },
    resolvePossibleLambda: function resolvePossibleLambda() {
      this.push([this.aliasable("container.lambda"), "(", this.popStack(), ", ", this.contextName(0), ")"]);
    },
    pushStringParam: function pushStringParam(string, type) {
      this.pushContext();
      this.pushString(type);
      if (type !== "SubExpression") {
        if (typeof string === "string") {
          this.pushString(string);
        } else {
          this.pushStackLiteral(string);
        }
      }
    },
    emptyHash: function emptyHash(omitEmpty) {
      if (this.trackIds) {
        this.push("{}");
      }
      if (this.stringParams) {
        this.push("{}");
        this.push("{}");
      }
      this.pushStackLiteral(omitEmpty ? "undefined" : "{}");
    },
    pushHash: function pushHash() {
      if (this.hash) {
        this.hashes.push(this.hash);
      }
      this.hash = { values: {}, types: [], contexts: [], ids: [] };
    },
    popHash: function popHash() {
      var hash = this.hash;
      this.hash = this.hashes.pop();
      if (this.trackIds) {
        this.push(this.objectLiteral(hash.ids));
      }
      if (this.stringParams) {
        this.push(this.objectLiteral(hash.contexts));
        this.push(this.objectLiteral(hash.types));
      }
      this.push(this.objectLiteral(hash.values));
    },
    pushString: function pushString(string) {
      this.pushStackLiteral(this.quotedString(string));
    },
    pushLiteral: function pushLiteral(value) {
      this.pushStackLiteral(value);
    },
    pushProgram: function pushProgram(guid) {
      if (guid != null) {
        this.pushStackLiteral(this.programExpression(guid));
      } else {
        this.pushStackLiteral(null);
      }
    },
    registerDecorator: function registerDecorator(paramSize, name) {
      var foundDecorator = this.nameLookup("decorators", name, "decorator"), options = this.setupHelperArgs(name, paramSize);
      this.decorators.push(["var decorator = ", foundDecorator, ";"]);
      this.decorators.push(['if (typeof decorator !== "function") { throw new Error(', this.quotedString('Missing decorator: "' + name + '"'), "); }"]);
      this.decorators.push(["fn = ", this.decorators.functionCall("decorator", "", ["fn", "props", "container", options]), " || fn;"]);
    },
    invokeHelper: function invokeHelper(paramSize, name, isSimple) {
      var nonHelper = this.popStack(), helper = this.setupHelper(paramSize, name);
      var possibleFunctionCalls = [];
      if (isSimple) {
        possibleFunctionCalls.push(helper.name);
      }
      possibleFunctionCalls.push(nonHelper);
      if (!this.options.strict) {
        possibleFunctionCalls.push(this.aliasable("container.hooks.helperMissing"));
      }
      var functionLookupCode = ["(", this.itemsSeparatedBy(possibleFunctionCalls, "||"), ")"];
      var functionCall = this.source.functionCall(functionLookupCode, "call", helper.callParams);
      this.push(functionCall);
    },
    itemsSeparatedBy: function itemsSeparatedBy(items, separator) {
      var result = [];
      result.push(items[0]);
      for (var i = 1;i < items.length; i++) {
        result.push(separator, items[i]);
      }
      return result;
    },
    invokeKnownHelper: function invokeKnownHelper(paramSize, name) {
      var helper = this.setupHelper(paramSize, name);
      this.push(this.source.functionCall(helper.name, "call", helper.callParams));
    },
    invokeAmbiguous: function invokeAmbiguous(name, helperCall) {
      this.useRegister("helper");
      var nonHelper = this.popStack();
      this.emptyHash();
      var helper = this.setupHelper(0, name, helperCall);
      var helperName = this.lastHelper = this.nameLookup("helpers", name, "helper");
      var lookup = ["(", "(helper = ", helperName, " || ", nonHelper, ")"];
      if (!this.options.strict) {
        lookup[0] = "(helper = ";
        lookup.push(" != null ? helper : ", this.aliasable("container.hooks.helperMissing"));
      }
      this.push(["(", lookup, helper.paramsInit ? ["),(", helper.paramsInit] : [], "),", "(typeof helper === ", this.aliasable('"function"'), " ? ", this.source.functionCall("helper", "call", helper.callParams), " : helper))"]);
    },
    invokePartial: function invokePartial(isDynamic, name, indent) {
      var params = [], options = this.setupParams(name, 1, params);
      if (isDynamic) {
        name = this.popStack();
        delete options.name;
      }
      if (indent) {
        options.indent = JSON.stringify(indent);
      }
      options.helpers = "helpers";
      options.partials = "partials";
      options.decorators = "container.decorators";
      if (!isDynamic) {
        params.unshift(this.nameLookup("partials", name, "partial"));
      } else {
        params.unshift(name);
      }
      if (this.options.compat) {
        options.depths = "depths";
      }
      options = this.objectLiteral(options);
      params.push(options);
      this.push(this.source.functionCall("container.invokePartial", "", params));
    },
    assignToHash: function assignToHash(key) {
      var value = this.popStack(), context = undefined, type = undefined, id = undefined;
      if (this.trackIds) {
        id = this.popStack();
      }
      if (this.stringParams) {
        type = this.popStack();
        context = this.popStack();
      }
      var hash = this.hash;
      if (context) {
        hash.contexts[key] = context;
      }
      if (type) {
        hash.types[key] = type;
      }
      if (id) {
        hash.ids[key] = id;
      }
      hash.values[key] = value;
    },
    pushId: function pushId(type, name, child) {
      if (type === "BlockParam") {
        this.pushStackLiteral("blockParams[" + name[0] + "].path[" + name[1] + "]" + (child ? " + " + JSON.stringify("." + child) : ""));
      } else if (type === "PathExpression") {
        this.pushString(name);
      } else if (type === "SubExpression") {
        this.pushStackLiteral("true");
      } else {
        this.pushStackLiteral("null");
      }
    },
    compiler: JavaScriptCompiler,
    compileChildren: function compileChildren(environment, options) {
      var children = environment.children, child = undefined, compiler = undefined;
      for (var i = 0, l = children.length;i < l; i++) {
        child = children[i];
        compiler = new this.compiler;
        var existing = this.matchExistingProgram(child);
        if (existing == null) {
          var index = this.context.programs.push("") - 1;
          child.index = index;
          child.name = "program" + index;
          this.context.programs[index] = compiler.compile(child, options, this.context, !this.precompile);
          this.context.decorators[index] = compiler.decorators;
          this.context.environments[index] = child;
          this.useDepths = this.useDepths || compiler.useDepths;
          this.useBlockParams = this.useBlockParams || compiler.useBlockParams;
          child.useDepths = this.useDepths;
          child.useBlockParams = this.useBlockParams;
        } else {
          child.index = existing.index;
          child.name = "program" + existing.index;
          this.useDepths = this.useDepths || existing.useDepths;
          this.useBlockParams = this.useBlockParams || existing.useBlockParams;
        }
      }
    },
    matchExistingProgram: function matchExistingProgram(child) {
      for (var i = 0, len = this.context.environments.length;i < len; i++) {
        var environment = this.context.environments[i];
        if (environment && environment.equals(child)) {
          return environment;
        }
      }
    },
    programExpression: function programExpression(guid) {
      var child = this.environment.children[guid], programParams = [child.index, "data", child.blockParams];
      if (this.useBlockParams || this.useDepths) {
        programParams.push("blockParams");
      }
      if (this.useDepths) {
        programParams.push("depths");
      }
      return "container.program(" + programParams.join(", ") + ")";
    },
    useRegister: function useRegister(name) {
      if (!this.registers[name]) {
        this.registers[name] = true;
        this.registers.list.push(name);
      }
    },
    push: function push(expr) {
      if (!(expr instanceof Literal)) {
        expr = this.source.wrap(expr);
      }
      this.inlineStack.push(expr);
      return expr;
    },
    pushStackLiteral: function pushStackLiteral(item) {
      this.push(new Literal(item));
    },
    pushSource: function pushSource(source) {
      if (this.pendingContent) {
        this.source.push(this.appendToBuffer(this.source.quotedString(this.pendingContent), this.pendingLocation));
        this.pendingContent = undefined;
      }
      if (source) {
        this.source.push(source);
      }
    },
    replaceStack: function replaceStack(callback) {
      var prefix = ["("], stack = undefined, createdStack = undefined, usedLiteral = undefined;
      if (!this.isInline()) {
        throw new _exception2["default"]("replaceStack on non-inline");
      }
      var top = this.popStack(true);
      if (top instanceof Literal) {
        stack = [top.value];
        prefix = ["(", stack];
        usedLiteral = true;
      } else {
        createdStack = true;
        var _name = this.incrStack();
        prefix = ["((", this.push(_name), " = ", top, ")"];
        stack = this.topStack();
      }
      var item = callback.call(this, stack);
      if (!usedLiteral) {
        this.popStack();
      }
      if (createdStack) {
        this.stackSlot--;
      }
      this.push(prefix.concat(item, ")"));
    },
    incrStack: function incrStack() {
      this.stackSlot++;
      if (this.stackSlot > this.stackVars.length) {
        this.stackVars.push("stack" + this.stackSlot);
      }
      return this.topStackName();
    },
    topStackName: function topStackName() {
      return "stack" + this.stackSlot;
    },
    flushInline: function flushInline() {
      var inlineStack = this.inlineStack;
      this.inlineStack = [];
      for (var i = 0, len = inlineStack.length;i < len; i++) {
        var entry = inlineStack[i];
        if (entry instanceof Literal) {
          this.compileStack.push(entry);
        } else {
          var stack = this.incrStack();
          this.pushSource([stack, " = ", entry, ";"]);
          this.compileStack.push(stack);
        }
      }
    },
    isInline: function isInline() {
      return this.inlineStack.length;
    },
    popStack: function popStack(wrapped) {
      var inline = this.isInline(), item = (inline ? this.inlineStack : this.compileStack).pop();
      if (!wrapped && item instanceof Literal) {
        return item.value;
      } else {
        if (!inline) {
          if (!this.stackSlot) {
            throw new _exception2["default"]("Invalid stack pop");
          }
          this.stackSlot--;
        }
        return item;
      }
    },
    topStack: function topStack() {
      var stack = this.isInline() ? this.inlineStack : this.compileStack, item = stack[stack.length - 1];
      if (item instanceof Literal) {
        return item.value;
      } else {
        return item;
      }
    },
    contextName: function contextName(context) {
      if (this.useDepths && context) {
        return "depths[" + context + "]";
      } else {
        return "depth" + context;
      }
    },
    quotedString: function quotedString(str) {
      return this.source.quotedString(str);
    },
    objectLiteral: function objectLiteral(obj) {
      return this.source.objectLiteral(obj);
    },
    aliasable: function aliasable(name) {
      var ret = this.aliases[name];
      if (ret) {
        ret.referenceCount++;
        return ret;
      }
      ret = this.aliases[name] = this.source.wrap(name);
      ret.aliasable = true;
      ret.referenceCount = 1;
      return ret;
    },
    setupHelper: function setupHelper(paramSize, name, blockHelper) {
      var params = [], paramsInit = this.setupHelperArgs(name, paramSize, params, blockHelper);
      var foundHelper = this.nameLookup("helpers", name, "helper"), callContext = this.aliasable(this.contextName(0) + " != null ? " + this.contextName(0) + " : (container.nullContext || {})");
      return {
        params,
        paramsInit,
        name: foundHelper,
        callParams: [callContext].concat(params)
      };
    },
    setupParams: function setupParams(helper, paramSize, params) {
      var options = {}, contexts = [], types = [], ids = [], objectArgs = !params, param = undefined;
      if (objectArgs) {
        params = [];
      }
      options.name = this.quotedString(helper);
      options.hash = this.popStack();
      if (this.trackIds) {
        options.hashIds = this.popStack();
      }
      if (this.stringParams) {
        options.hashTypes = this.popStack();
        options.hashContexts = this.popStack();
      }
      var inverse = this.popStack(), program = this.popStack();
      if (program || inverse) {
        options.fn = program || "container.noop";
        options.inverse = inverse || "container.noop";
      }
      var i = paramSize;
      while (i--) {
        param = this.popStack();
        params[i] = param;
        if (this.trackIds) {
          ids[i] = this.popStack();
        }
        if (this.stringParams) {
          types[i] = this.popStack();
          contexts[i] = this.popStack();
        }
      }
      if (objectArgs) {
        options.args = this.source.generateArray(params);
      }
      if (this.trackIds) {
        options.ids = this.source.generateArray(ids);
      }
      if (this.stringParams) {
        options.types = this.source.generateArray(types);
        options.contexts = this.source.generateArray(contexts);
      }
      if (this.options.data) {
        options.data = "data";
      }
      if (this.useBlockParams) {
        options.blockParams = "blockParams";
      }
      return options;
    },
    setupHelperArgs: function setupHelperArgs(helper, paramSize, params, useRegister) {
      var options = this.setupParams(helper, paramSize, params);
      options.loc = JSON.stringify(this.source.currentLocation);
      options = this.objectLiteral(options);
      if (useRegister) {
        this.useRegister("options");
        params.push("options");
        return ["options=", options];
      } else if (params) {
        params.push(options);
        return "";
      } else {
        return options;
      }
    }
  };
  (function() {
    var reservedWords = ("break else new var" + " case finally return void" + " catch for switch while" + " continue function this with" + " default if throw" + " delete in try" + " do instanceof typeof" + " abstract enum int short" + " boolean export interface static" + " byte extends long super" + " char final native synchronized" + " class float package throws" + " const goto private transient" + " debugger implements protected volatile" + " double import public let yield await" + " null true false").split(" ");
    var compilerWords = JavaScriptCompiler.RESERVED_WORDS = {};
    for (var i = 0, l = reservedWords.length;i < l; i++) {
      compilerWords[reservedWords[i]] = true;
    }
  })();
  JavaScriptCompiler.isValidJavaScriptVariableName = function(name) {
    return !JavaScriptCompiler.RESERVED_WORDS[name] && /^[a-zA-Z_$][0-9a-zA-Z_$]*$/.test(name);
  };
  function strictLookup(requireTerminal, compiler, parts, startPartIndex, type) {
    var stack = compiler.popStack(), len = parts.length;
    if (requireTerminal) {
      len--;
    }
    for (var i = startPartIndex;i < len; i++) {
      stack = compiler.nameLookup(stack, parts[i], type);
    }
    if (requireTerminal) {
      return [compiler.aliasable("container.strict"), "(", stack, ", ", compiler.quotedString(parts[len]), ", ", JSON.stringify(compiler.source.currentLocation), " )"];
    } else {
      return stack;
    }
  }
  exports.default = JavaScriptCompiler;
  module.exports = exports["default"];
});

// node_modules/.bun/handlebars@4.7.9/node_modules/handlebars/dist/cjs/handlebars.js
var require_handlebars = __commonJS(function(exports, module) {
  exports.__esModule = true;
  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
  }
  var _handlebarsRuntime = require_handlebars_runtime();
  var _handlebarsRuntime2 = _interopRequireDefault(_handlebarsRuntime);
  var _handlebarsCompilerAst = require_ast();
  var _handlebarsCompilerAst2 = _interopRequireDefault(_handlebarsCompilerAst);
  var _handlebarsCompilerBase = require_base2();
  var _handlebarsCompilerCompiler = require_compiler();
  var _handlebarsCompilerJavascriptCompiler = require_javascript_compiler();
  var _handlebarsCompilerJavascriptCompiler2 = _interopRequireDefault(_handlebarsCompilerJavascriptCompiler);
  var _handlebarsCompilerVisitor = require_visitor();
  var _handlebarsCompilerVisitor2 = _interopRequireDefault(_handlebarsCompilerVisitor);
  var _handlebarsNoConflict = require_no_conflict();
  var _handlebarsNoConflict2 = _interopRequireDefault(_handlebarsNoConflict);
  var _create = _handlebarsRuntime2["default"].create;
  function create() {
    var hb = _create();
    hb.compile = function(input, options) {
      return _handlebarsCompilerCompiler.compile(input, options, hb);
    };
    hb.precompile = function(input, options) {
      return _handlebarsCompilerCompiler.precompile(input, options, hb);
    };
    hb.AST = _handlebarsCompilerAst2["default"];
    hb.Compiler = _handlebarsCompilerCompiler.Compiler;
    hb.JavaScriptCompiler = _handlebarsCompilerJavascriptCompiler2["default"];
    hb.Parser = _handlebarsCompilerBase.parser;
    hb.parse = _handlebarsCompilerBase.parse;
    hb.parseWithoutProcessing = _handlebarsCompilerBase.parseWithoutProcessing;
    return hb;
  }
  var inst = create();
  inst.create = create;
  _handlebarsNoConflict2["default"](inst);
  inst.Visitor = _handlebarsCompilerVisitor2["default"];
  inst["default"] = inst;
  exports.default = inst;
  module.exports = exports["default"];
});

// packages/generator/src/templates/loader.ts
function resolveOsUser() {
  if (process.env.PGUSER)
    return process.env.PGUSER;
  if (process.env.USER)
    return process.env.USER;
  if (process.env.LOGNAME)
    return process.env.LOGNAME;
  try {
    return execSync("whoami").toString().trim() || "postgres";
  } catch {
    return "postgres";
  }
}
function resolvePgSocketDir() {
  const port = process.env.PGPORT || "5432";
  const candidates = [process.env.PGHOST, "/var/run/postgresql", "/tmp"].filter((candidate) => !!candidate && candidate.startsWith("/"));
  for (const dir of candidates) {
    if (existsSync(path_default.join(dir, `.s.PGSQL.${port}`))) {
      return dir;
    }
  }
  return "";
}
function sqlTypeFor(referenceId, fieldLength) {
  const length = typeof fieldLength === "number" ? fieldLength : undefined;
  const mapping = {
    [ReferenceType.STRING]: length ? `varchar(${length})` : "varchar(255)",
    [ReferenceType.INTEGER]: "integer",
    [ReferenceType.AMOUNT]: "decimal(18,6)",
    [ReferenceType.ID]: "uuid",
    [ReferenceType.TEXT]: "text",
    [ReferenceType.DATE]: "date",
    [ReferenceType.DATETIME]: "timestamp",
    [ReferenceType.LIST]: "varchar(40)",
    [ReferenceType.TABLE]: "uuid",
    [ReferenceType.TABLE_DIRECT]: "uuid",
    [ReferenceType.YES_NO]: "boolean",
    [ReferenceType.JSON]: "jsonb",
    [ReferenceType.URL]: "varchar(500)",
    [ReferenceType.IMAGE]: "varchar(500)",
    [ReferenceType.FILE]: "varchar(500)",
    [ReferenceType.EMAIL]: "varchar(255)",
    [ReferenceType.PHONE]: "varchar(40)",
    [ReferenceType.PASSWORD]: "varchar(255)",
    [ReferenceType.COLOR]: "varchar(20)"
  };
  return mapping[referenceId] || "varchar(255)";
}

class TemplateLoader {
  templateDir;
  cache = new Map;
  constructor(templateDir) {
    this.templateDir = templateDir;
    this.registerHelpers();
  }
  async load(templatePath) {
    if (this.cache.has(templatePath)) {
      return this.cache.get(templatePath);
    }
    const fullPath = path_default.join(this.templateDir, templatePath);
    const source = await promises.readFile(fullPath, "utf-8");
    const template = import_handlebars.default.compile(source, { noEscape: true });
    this.cache.set(templatePath, template);
    return template;
  }
  clearCache() {
    this.cache.clear();
  }
  registerHelpers() {
    import_handlebars.default.registerHelper("pascalCase", pascalCase);
    import_handlebars.default.registerHelper("camelCase", camelCase);
    import_handlebars.default.registerHelper("snakeCase", snakeCase);
    import_handlebars.default.registerHelper("kebabCase", kebabCase);
    import_handlebars.default.registerHelper("plural", plural);
    import_handlebars.default.registerHelper("singular", singular);
    import_handlebars.default.registerHelper("upperCase", (str) => str?.toUpperCase() || "");
    import_handlebars.default.registerHelper("lowerCase", (str) => str?.toLowerCase() || "");
    import_handlebars.default.registerHelper("capitalize", (str) => str ? str.charAt(0).toUpperCase() + str.slice(1) : "");
    import_handlebars.default.registerHelper("eq", (a, b) => a === b);
    import_handlebars.default.registerHelper("ne", (a, b) => a !== b);
    import_handlebars.default.registerHelper("lt", (a, b) => a < b);
    import_handlebars.default.registerHelper("lte", (a, b) => a <= b);
    import_handlebars.default.registerHelper("gt", (a, b) => a > b);
    import_handlebars.default.registerHelper("gte", (a, b) => a >= b);
    import_handlebars.default.registerHelper("and", (...args) => args.slice(0, -1).every(Boolean));
    import_handlebars.default.registerHelper("or", (...args) => args.slice(0, -1).some(Boolean));
    import_handlebars.default.registerHelper("not", (value) => !value);
    import_handlebars.default.registerHelper("eachFirst", function(items, count, options) {
      if (!Array.isArray(items) || items.length === 0) {
        return options.inverse(this);
      }
      const slice = items.slice(0, count);
      return slice.map((item, index) => options.fn(item, {
        data: { index, first: index === 0, last: index === slice.length - 1 }
      })).join("");
    });
    import_handlebars.default.registerHelper("addBusPrefix", addBusPrefix);
    import_handlebars.default.registerHelper("addSysPrefix", addSysPrefix);
    import_handlebars.default.registerHelper("removeTablePrefix", removeTablePrefix);
    import_handlebars.default.registerHelper("isSystemTable", isSystemTable);
    import_handlebars.default.registerHelper("isBusinessTable", isBusinessTable);
    import_handlebars.default.registerHelper("tableToEntity", tableNameToEntityName);
    import_handlebars.default.registerHelper("tableToModel", tableNameToModelName);
    import_handlebars.default.registerHelper("tableToController", tableNameToControllerName);
    import_handlebars.default.registerHelper("tableToService", tableNameToServiceName);
    import_handlebars.default.registerHelper("tableToModule", tableNameToModuleName);
    import_handlebars.default.registerHelper("tableToDto", tableNameToDtoName);
    import_handlebars.default.registerHelper("tableToRoute", tableNameToRoutePath);
    import_handlebars.default.registerHelper("tableToEntitySet", tableNameToEntitySetName);
    import_handlebars.default.registerHelper("primaryKeyName", generatePrimaryKeyName);
    import_handlebars.default.registerHelper("foreignKeyName", generateForeignKeyName);
    import_handlebars.default.registerHelper("randomSeq", (index) => (index + 1) * 10 + Math.floor(Math.random() * 5));
    import_handlebars.default.registerHelper("tsType", (referenceId) => {
      const mapping = {
        [ReferenceType.STRING]: "string",
        [ReferenceType.INTEGER]: "number",
        [ReferenceType.AMOUNT]: "number",
        [ReferenceType.ID]: "string",
        [ReferenceType.TEXT]: "string",
        [ReferenceType.DATE]: "Date",
        [ReferenceType.DATETIME]: "Date",
        [ReferenceType.LIST]: "string",
        [ReferenceType.TABLE]: "string",
        [ReferenceType.TABLE_DIRECT]: "string",
        [ReferenceType.YES_NO]: "boolean",
        [ReferenceType.JSON]: "Record<string, unknown>",
        [ReferenceType.URL]: "string",
        [ReferenceType.IMAGE]: "string",
        [ReferenceType.FILE]: "string",
        [ReferenceType.EMAIL]: "string",
        [ReferenceType.PHONE]: "string",
        [ReferenceType.PASSWORD]: "string",
        [ReferenceType.COLOR]: "string"
      };
      return mapping[referenceId] || "string";
    });
    import_handlebars.default.registerHelper("tsTypeFromString", (type) => {
      const mapping = {
        string: "string",
        varchar: "string",
        text: "string",
        integer: "number",
        int: "number",
        bigint: "number",
        decimal: "number",
        float: "number",
        number: "number",
        boolean: "boolean",
        bool: "boolean",
        date: "Date",
        datetime: "Date",
        timestamp: "Date",
        json: "Record<string, unknown>",
        jsonb: "Record<string, unknown>",
        uuid: "string",
        id: "string",
        email: "string",
        url: "string",
        password: "string",
        phone: "string",
        color: "string",
        file: "string",
        image: "string",
        amount: "number"
      };
      return mapping[type?.toLowerCase()] || "unknown";
    });
    import_handlebars.default.registerHelper("zodType", (referenceId, isMandatory = false) => {
      const mapping = {
        [ReferenceType.STRING]: "z.string()",
        [ReferenceType.INTEGER]: "z.number().int()",
        [ReferenceType.AMOUNT]: "z.number()",
        [ReferenceType.ID]: "z.string().uuid()",
        [ReferenceType.TEXT]: "z.string()",
        [ReferenceType.DATE]: "z.coerce.date()",
        [ReferenceType.DATETIME]: "z.coerce.date()",
        [ReferenceType.LIST]: "z.string()",
        [ReferenceType.TABLE]: "z.string().uuid()",
        [ReferenceType.TABLE_DIRECT]: "z.string().uuid()",
        [ReferenceType.YES_NO]: "z.boolean()",
        [ReferenceType.JSON]: "z.record(z.unknown())",
        [ReferenceType.URL]: "z.string().url()",
        [ReferenceType.IMAGE]: "z.string()",
        [ReferenceType.FILE]: "z.string()",
        [ReferenceType.EMAIL]: "z.string().email()",
        [ReferenceType.PHONE]: "z.string()",
        [ReferenceType.PASSWORD]: "z.string().min(8)",
        [ReferenceType.COLOR]: "z.string()"
      };
      const baseType = mapping[referenceId] || "z.string()";
      return isMandatory ? baseType : `${baseType}.optional()`;
    });
    import_handlebars.default.registerHelper("sqlType", sqlTypeFor);
    import_handlebars.default.registerHelper("kyselyType", (referenceId, fieldLength) => {
      const length = typeof fieldLength === "number" ? fieldLength : undefined;
      const mapping = {
        [ReferenceType.STRING]: length ? `varchar(${length})` : "varchar(255)",
        [ReferenceType.INTEGER]: "integer",
        [ReferenceType.AMOUNT]: "decimal(18, 6)",
        [ReferenceType.ID]: "uuid",
        [ReferenceType.TEXT]: "text",
        [ReferenceType.DATE]: "date",
        [ReferenceType.DATETIME]: "timestamp",
        [ReferenceType.LIST]: "varchar(40)",
        [ReferenceType.TABLE]: "uuid",
        [ReferenceType.TABLE_DIRECT]: "uuid",
        [ReferenceType.YES_NO]: "boolean",
        [ReferenceType.JSON]: "jsonb",
        [ReferenceType.URL]: "varchar(500)",
        [ReferenceType.IMAGE]: "varchar(500)",
        [ReferenceType.FILE]: "varchar(500)",
        [ReferenceType.EMAIL]: "varchar(255)",
        [ReferenceType.PHONE]: "varchar(40)",
        [ReferenceType.PASSWORD]: "varchar(255)",
        [ReferenceType.COLOR]: "varchar(20)"
      };
      return mapping[referenceId] || "varchar(255)";
    });
    import_handlebars.default.registerHelper("tanstackQueryKey", (entity) => `['${entity}', 'list']`);
    import_handlebars.default.registerHelper("tanstackDetailKey", (entity, id) => {
      const idVar = typeof id === "string" ? id : "id";
      return `['${entity}', 'detail', ${idVar}]`;
    });
    import_handlebars.default.registerHelper("tanstackMutationKey", (entity, action) => `['${entity}', '${action}']`);
    import_handlebars.default.registerHelper("tanstackColumnType", (referenceId) => {
      const mapping = {
        [ReferenceType.STRING]: "text",
        [ReferenceType.INTEGER]: "number",
        [ReferenceType.AMOUNT]: "number",
        [ReferenceType.DATE]: "date",
        [ReferenceType.DATETIME]: "datetime",
        [ReferenceType.YES_NO]: "boolean",
        [ReferenceType.EMAIL]: "text"
      };
      return mapping[referenceId] || "text";
    });
    import_handlebars.default.registerHelper("tanstackFieldType", (referenceId) => {
      const mapping = {
        [ReferenceType.STRING]: "input",
        [ReferenceType.INTEGER]: "number",
        [ReferenceType.AMOUNT]: "number",
        [ReferenceType.TEXT]: "textarea",
        [ReferenceType.DATE]: "date",
        [ReferenceType.DATETIME]: "datetime-local",
        [ReferenceType.YES_NO]: "checkbox",
        [ReferenceType.LIST]: "select",
        [ReferenceType.TABLE]: "select",
        [ReferenceType.EMAIL]: "email",
        [ReferenceType.URL]: "url",
        [ReferenceType.PASSWORD]: "password",
        [ReferenceType.COLOR]: "color"
      };
      return mapping[referenceId] || "input";
    });
    import_handlebars.default.registerHelper("nestControllerName", (entity) => `${pascalCase(entity)}Controller`);
    import_handlebars.default.registerHelper("nestServiceName", (entity) => `${pascalCase(entity)}Service`);
    import_handlebars.default.registerHelper("nestModuleName", (entity) => `${pascalCase(entity)}Module`);
    import_handlebars.default.registerHelper("nestDtoName", (entity, prefix = "") => `${prefix}${pascalCase(entity)}Dto`);
    import_handlebars.default.registerHelper("nestGuardName", (name) => `${pascalCase(name)}Guard`);
    import_handlebars.default.registerHelper("nestDecoratorName", (name) => `${pascalCase(name)}`);
    import_handlebars.default.registerHelper("shadcnInputType", (referenceId) => {
      const mapping = {
        [ReferenceType.STRING]: "text",
        [ReferenceType.INTEGER]: "number",
        [ReferenceType.AMOUNT]: "number",
        [ReferenceType.EMAIL]: "email",
        [ReferenceType.URL]: "url",
        [ReferenceType.PASSWORD]: "password",
        [ReferenceType.PHONE]: "tel",
        [ReferenceType.COLOR]: "color"
      };
      return mapping[referenceId] || "text";
    });
    import_handlebars.default.registerHelper("shadcnComponent", (referenceId) => {
      const mapping = {
        [ReferenceType.STRING]: "Input",
        [ReferenceType.INTEGER]: "Input",
        [ReferenceType.AMOUNT]: "Input",
        [ReferenceType.TEXT]: "Textarea",
        [ReferenceType.DATE]: "DatePicker",
        [ReferenceType.DATETIME]: "DatePicker",
        [ReferenceType.YES_NO]: "Checkbox",
        [ReferenceType.LIST]: "Select",
        [ReferenceType.TABLE]: "Select"
      };
      return mapping[referenceId] || "Input";
    });
    import_handlebars.default.registerHelper("rustType", (referenceId, isMandatory) => {
      const mapping = {
        [ReferenceType.STRING]: "String",
        [ReferenceType.INTEGER]: "i32",
        [ReferenceType.AMOUNT]: "Decimal",
        [ReferenceType.ID]: "Uuid",
        [ReferenceType.TEXT]: "String",
        [ReferenceType.DATE]: "NaiveDate",
        [ReferenceType.DATETIME]: "DateTime<Utc>",
        [ReferenceType.LIST]: "String",
        [ReferenceType.TABLE]: "Uuid",
        [ReferenceType.TABLE_DIRECT]: "Uuid",
        [ReferenceType.YES_NO]: "bool",
        [ReferenceType.LOCATION]: "String",
        [ReferenceType.LOCATOR]: "String",
        [ReferenceType.ACCOUNT]: "String",
        [ReferenceType.URL]: "String",
        [ReferenceType.IMAGE]: "String",
        [ReferenceType.FILE]: "String",
        [ReferenceType.COLOR]: "String",
        [ReferenceType.JSON]: "serde_json::Value",
        [ReferenceType.PASSWORD]: "String",
        [ReferenceType.EMAIL]: "String",
        [ReferenceType.PHONE]: "String"
      };
      const baseType = mapping[referenceId] || "String";
      return isMandatory === true ? baseType : `Option<${baseType}>`;
    });
    import_handlebars.default.registerHelper("rustIdent", (name) => RUST_KEYWORDS.has(String(name)) ? `r#${String(name)}` : String(name));
    import_handlebars.default.registerHelper("seaOrmType", (referenceId, required, isForeignKey) => {
      const isTrue = (value) => value === true;
      const mapping = {
        [ReferenceType.STRING]: "String",
        [ReferenceType.INTEGER]: "i32",
        [ReferenceType.AMOUNT]: "Decimal",
        [ReferenceType.ID]: "Uuid",
        [ReferenceType.TEXT]: "String",
        [ReferenceType.DATE]: "Date",
        [ReferenceType.DATETIME]: "DateTimeWithTimeZone",
        [ReferenceType.LIST]: "String",
        [ReferenceType.TABLE]: "Uuid",
        [ReferenceType.TABLE_DIRECT]: "Uuid",
        [ReferenceType.YES_NO]: "bool",
        [ReferenceType.LOCATION]: "String",
        [ReferenceType.LOCATOR]: "String",
        [ReferenceType.ACCOUNT]: "String",
        [ReferenceType.URL]: "String",
        [ReferenceType.IMAGE]: "String",
        [ReferenceType.FILE]: "String",
        [ReferenceType.COLOR]: "String",
        [ReferenceType.JSON]: "Json",
        [ReferenceType.PASSWORD]: "String",
        [ReferenceType.EMAIL]: "String",
        [ReferenceType.PHONE]: "String"
      };
      const fkBecomesUuid = isTrue(isForeignKey) && (referenceId === ReferenceType.STRING || referenceId === ReferenceType.INTEGER);
      const base = fkBecomesUuid ? "Uuid" : mapping[referenceId] ?? "String";
      return isTrue(required) ? base : `Option<${base}>`;
    });
    import_handlebars.default.registerHelper("sqlTypeRust", sqlTypeFor);
    import_handlebars.default.registerHelper("rustModName", (entity) => snakeCase(entity));
    import_handlebars.default.registerHelper("rustStructName", (entity) => pascalCase(entity));
    import_handlebars.default.registerHelper("rustRouteParam", (name) => `{${name}}`);
    import_handlebars.default.registerHelper("serdeAttr", (columnName) => {
      const fieldName = snakeCase(columnName);
      return fieldName === columnName ? "" : `#[serde(rename = "${columnName}")]`;
    });
    import_handlebars.default.registerHelper("astryxComponent", (referenceId) => {
      const mapping = {
        [ReferenceType.STRING]: "TextInput",
        [ReferenceType.INTEGER]: "NumberInput",
        [ReferenceType.AMOUNT]: "NumberInput",
        [ReferenceType.ID]: "TextInput",
        [ReferenceType.TEXT]: "TextArea",
        [ReferenceType.DATE]: "DateInput",
        [ReferenceType.DATETIME]: "DateTimeInput",
        [ReferenceType.LIST]: "Selector",
        [ReferenceType.TABLE]: "Typeahead",
        [ReferenceType.TABLE_DIRECT]: "Selector",
        [ReferenceType.YES_NO]: "Switch",
        [ReferenceType.IMAGE]: "FileInput",
        [ReferenceType.FILE]: "FileInput",
        [ReferenceType.JSON]: "TextArea"
      };
      return mapping[referenceId] || "TextInput";
    });
    import_handlebars.default.registerHelper("astryxImport", (component) => `@astryxdesign/core/${component}`);
    import_handlebars.default.registerHelper("astryxCellRenderer", (referenceId) => {
      const mapping = {
        [ReferenceType.YES_NO]: "StatusDot",
        [ReferenceType.DATE]: "DateCell",
        [ReferenceType.DATETIME]: "DateTimeCell",
        [ReferenceType.AMOUNT]: "NumberCell",
        [ReferenceType.INTEGER]: "NumberCell",
        [ReferenceType.LIST]: "Token",
        [ReferenceType.URL]: "LinkCell",
        [ReferenceType.IMAGE]: "Avatar",
        [ReferenceType.PASSWORD]: "MaskedCell"
      };
      return mapping[referenceId] || "TextCell";
    });
    import_handlebars.default.registerHelper("astryxInputType", (referenceId) => {
      const mapping = {
        [ReferenceType.EMAIL]: "email",
        [ReferenceType.URL]: "url",
        [ReferenceType.PASSWORD]: "password",
        [ReferenceType.PHONE]: "tel",
        [ReferenceType.COLOR]: "color"
      };
      return mapping[referenceId] || "text";
    });
    import_handlebars.default.registerHelper("json", (context) => JSON.stringify(context, null, 2));
    import_handlebars.default.registerHelper("jsonInline", (context) => JSON.stringify(context));
    import_handlebars.default.registerHelper("first", (array, property) => {
      const firstItem = array?.[0];
      if (typeof property === "string" && firstItem) {
        return firstItem[property];
      }
      return firstItem;
    });
    import_handlebars.default.registerHelper("last", (array, property) => {
      const lastItem = array?.[array?.length - 1];
      if (typeof property === "string" && lastItem) {
        return lastItem[property];
      }
      return lastItem;
    });
    import_handlebars.default.registerHelper("length", (array) => array?.length || 0);
    import_handlebars.default.registerHelper("includes", (array, value) => array?.includes(value));
    import_handlebars.default.registerHelper("join", (array, separator = ", ") => array?.join(separator) || "");
    import_handlebars.default.registerHelper("slice", (array, start, end) => array?.slice(start, end));
    import_handlebars.default.registerHelper("range", (start, end) => {
      const result = [];
      for (let i = start;i <= end; i++)
        result.push(i);
      return result;
    });
    import_handlebars.default.registerHelper("indexPlusOne", (index) => index + 1);
    import_handlebars.default.registerHelper("isFirst", (index) => index === 0);
    import_handlebars.default.registerHelper("isLast", (index, array) => index === array.length - 1);
    import_handlebars.default.registerHelper("isEven", (index) => index % 2 === 0);
    import_handlebars.default.registerHelper("isOdd", (index) => index % 2 !== 0);
    import_handlebars.default.registerHelper("now", () => new Date().toISOString());
    import_handlebars.default.registerHelper("timestamp", () => Date.now());
    import_handlebars.default.registerHelper("osUser", () => resolveOsUser());
    import_handlebars.default.registerHelper("pgSocketParam", () => {
      const dir = resolvePgSocketDir();
      return dir ? `?host=${encodeURIComponent(dir)}` : "";
    });
    import_handlebars.default.registerHelper("formatDate", (date, format) => {
      const d = new Date(date);
      if (format === "iso")
        return d.toISOString();
      if (format === "date")
        return d.toISOString().split("T")[0];
      return d.toISOString();
    });
    import_handlebars.default.registerHelper("trim", (str) => str?.trim() || "");
    import_handlebars.default.registerHelper("replace", (str, search, replacement) => str?.replace(new RegExp(search, "g"), replacement) || "");
    import_handlebars.default.registerHelper("split", (str, separator) => str?.split(separator) || []);
    import_handlebars.default.registerHelper("endsWith", (str, suffix) => str?.endsWith(suffix) ?? false);
    import_handlebars.default.registerHelper("startsWith", (str, prefix) => str?.startsWith(prefix) ?? false);
    import_handlebars.default.registerHelper("shellDefault", (name, fallback) => new import_handlebars.default.SafeString(`\${${name}:-${fallback ?? ""}}`));
    import_handlebars.default.registerHelper("shellRequired", (name, message) => new import_handlebars.default.SafeString(typeof message === "string" && message ? `\${${name}:?${message}}` : `\${${name}:?${name} is required}`));
    import_handlebars.default.registerHelper("concat", (...args) => args.slice(0, -1).join(""));
    import_handlebars.default.registerHelper("substring", (str, start, length) => length ? str?.substring(start, start + length) : str?.substring(start));
    import_handlebars.default.registerHelper("padStart", (str, length, char = " ") => String(str).padStart(length, char));
    import_handlebars.default.registerHelper("padEnd", (str, length, char = " ") => String(str).padEnd(length, char));
    import_handlebars.default.registerHelper("add", (a, b) => a + b);
    import_handlebars.default.registerHelper("subtract", (a, b) => a - b);
    import_handlebars.default.registerHelper("multiply", (a, b) => a * b);
    import_handlebars.default.registerHelper("divide", (a, b) => a / b);
    import_handlebars.default.registerHelper("mod", (a, b) => a % b);
    import_handlebars.default.registerHelper("abs", (a) => Math.abs(a));
    import_handlebars.default.registerHelper("ceil", (a) => Math.ceil(a));
    import_handlebars.default.registerHelper("floor", (a) => Math.floor(a));
    import_handlebars.default.registerHelper("round", (a) => Math.round(a));
    import_handlebars.default.registerHelper("min", (...args) => Math.min(...args.slice(0, -1)));
    import_handlebars.default.registerHelper("max", (...args) => Math.max(...args.slice(0, -1)));
    import_handlebars.default.registerHelper("ifCond", function(v1, operator, v2, options) {
      switch (operator) {
        case "==":
          return v1 == v2 ? options.fn(this) : options.inverse(this);
        case "===":
          return v1 === v2 ? options.fn(this) : options.inverse(this);
        case "!=":
          return v1 != v2 ? options.fn(this) : options.inverse(this);
        case "!==":
          return v1 !== v2 ? options.fn(this) : options.inverse(this);
        case "<":
          return v1 < v2 ? options.fn(this) : options.inverse(this);
        case "<=":
          return v1 <= v2 ? options.fn(this) : options.inverse(this);
        case ">":
          return v1 > v2 ? options.fn(this) : options.inverse(this);
        case ">=":
          return v1 >= v2 ? options.fn(this) : options.inverse(this);
        case "&&":
          return v1 && v2 ? options.fn(this) : options.inverse(this);
        case "||":
          return v1 || v2 ? options.fn(this) : options.inverse(this);
        default:
          return options.inverse(this);
      }
    });
    import_handlebars.default.registerHelper("unless", function(condition, options) {
      return !condition ? options.fn(this) : options.inverse(this);
    });
    import_handlebars.default.registerHelper("switch", function(value, options) {
      this._switch_value_ = value;
      this._switch_matched_ = false;
      if (options && typeof options.fn === "function") {
        return options.fn(this);
      }
      return "";
    });
    import_handlebars.default.registerHelper("case", function(value, options) {
      if (value === this._switch_value_ && !this._switch_matched_) {
        this._switch_matched_ = true;
        if (options && typeof options.fn === "function") {
          return options.fn(this);
        }
      }
      return "";
    });
    import_handlebars.default.registerHelper("default", function(options) {
      if (!this._switch_matched_) {
        this._switch_matched_ = true;
        if (options && typeof options.fn === "function") {
          return options.fn(this);
        }
      }
      return "";
    });
    import_handlebars.default.registerHelper("uuid", () => {
      return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
        const r = Math.random() * 16 | 0;
        const v = c === "x" ? r : r & 3 | 8;
        return v.toString(16);
      });
    });
    import_handlebars.default.registerHelper("comment", (text, style = "line") => {
      if (style === "block") {
        return `/* ${text} */`;
      }
      return `// ${text}`;
    });
    import_handlebars.default.registerHelper("jsdoc", (description, params) => {
      let doc = `/**
 * ` + description;
      if (params) {
        doc += `
 *`;
        for (const [name, type] of Object.entries(params)) {
          doc += `
 * @param {${type}} ${name}`;
        }
      }
      doc += `
 */`;
      return doc;
    });
    import_handlebars.default.registerHelper("relativeImport", (from, to) => {
      const fromParts = from.split("/");
      const toParts = to.split("/");
      let commonLength = 0;
      for (let i = 0;i < Math.min(fromParts.length, toParts.length); i++) {
        if (fromParts[i] === toParts[i]) {
          commonLength++;
        } else {
          break;
        }
      }
      const upCount = fromParts.length - commonLength - 1;
      const relativeParts = toParts.slice(commonLength);
      if (upCount === 0) {
        return "./" + relativeParts.join("/");
      }
      return "../".repeat(upCount) + relativeParts.join("/");
    });
    import_handlebars.default.registerHelper("typeToReferenceId", (type) => {
      const mapping = {
        string: 10,
        varchar: 10,
        char: 10,
        integer: 11,
        int: 11,
        bigint: 11,
        smallint: 11,
        decimal: 12,
        numeric: 12,
        float: 12,
        double: 12,
        number: 12,
        real: 12,
        boolean: 20,
        bool: 20,
        date: 15,
        datetime: 16,
        timestamp: 16,
        timestamptz: 16,
        text: 14,
        json: 28,
        jsonb: 28,
        uuid: 13,
        id: 13,
        email: 29,
        url: 24,
        image: 25,
        file: 26,
        phone: 31,
        password: 30,
        color: 27
      };
      return mapping[type?.toLowerCase()] ?? 10;
    });
    import_handlebars.default.registerHelper("isExcludedField", (fieldName) => {
      const excludedFields = ["id", "created_at", "updated_at", "deleted_at"];
      const lowerFieldName = fieldName?.toLowerCase() || "";
      if (excludedFields.includes(lowerFieldName)) {
        return true;
      }
      if (lowerFieldName.includes("_id")) {
        return true;
      }
      return false;
    });
    import_handlebars.default.registerHelper("mockValue", (type, fieldName) => {
      const typeLower = type?.toLowerCase() || "";
      const nameLower = fieldName?.toLowerCase() || "";
      if (typeLower.includes("string") || typeLower.includes("text") || typeLower.includes("varchar")) {
        if (nameLower.includes("email")) {
          return "'test@example.com'";
        }
        if (nameLower.includes("name")) {
          return "'Test Name'";
        }
        if (nameLower.includes("phone")) {
          return "'+1234567890'";
        }
        return "'test_value'";
      }
      if (typeLower.includes("int") || typeLower.includes("number") || typeLower.includes("integer")) {
        return "123";
      }
      if (typeLower.includes("decimal") || typeLower.includes("float") || typeLower.includes("double")) {
        return "123.45";
      }
      if (typeLower.includes("bool") || typeLower.includes("boolean")) {
        return "true";
      }
      if (typeLower.includes("date") || typeLower.includes("time")) {
        return "new Date().toISOString()";
      }
      return "'test_value'";
    });
    import_handlebars.default.registerHelper("mockUniqueValue", (type, fieldName, index) => {
      const typeLower = type?.toLowerCase() || "";
      const nameLower = fieldName?.toLowerCase() || "";
      if (typeLower.includes("string") || typeLower.includes("text") || typeLower.includes("varchar")) {
        if (nameLower.includes("email")) {
          return `\`test${index}@example.com\``;
        }
        if (nameLower.includes("name")) {
          return `\`Test Name ${index}\``;
        }
        return `\`test_value_${index}\``;
      }
      if (typeLower.includes("int") || typeLower.includes("number") || typeLower.includes("integer")) {
        return `${100 + index}`;
      }
      if (typeLower.includes("decimal") || typeLower.includes("float") || typeLower.includes("double")) {
        return `${(100.5 + index).toFixed(2)}`;
      }
      return `\`test_${index}\``;
    });
    import_handlebars.default.registerHelper("seedValue", (fieldName, index) => {
      const n = (fieldName ?? "").toLowerCase();
      const i = typeof index === "number" ? index : 0;
      const FIRST_NAMES = [
        "James",
        "Mary",
        "Robert",
        "Patricia",
        "John",
        "Jennifer",
        "Michael",
        "Linda",
        "David",
        "Barbara"
      ];
      const LAST_NAMES = [
        "Smith",
        "Johnson",
        "Williams",
        "Brown",
        "Jones",
        "Garcia",
        "Miller",
        "Davis",
        "Wilson",
        "Taylor"
      ];
      const pick = (arr) => arr[i % arr.length];
      if (n === "first_name")
        return pick(FIRST_NAMES);
      if (n === "last_name")
        return pick(LAST_NAMES);
      if (n === "name" || n.endsWith("_name"))
        return `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`;
      if (n === "gender")
        return i % 2 === 0 ? "Male" : "Female";
      if (n === "relationship" || n === "relationship_type")
        return pick(["Mother", "Father", "Guardian", "Grandmother", "Grandfather"]);
      if (n === "grade" || n === "letter_grade")
        return pick(["A", "B+", "A-", "B", "A"]);
      if (n === "status")
        return pick(["Active", "Pending", "Completed", "In Progress", "Scheduled"]);
      if (n === "subject" || n === "subject_name")
        return pick(["Mathematics", "Science", "English", "History", "Geography"]);
      if (n === "department")
        return pick(["Engineering", "Marketing", "Finance", "Operations", "HR"]);
      if (n === "address" || n === "street_address")
        return `${(i + 1) * 100} ${pick(["Main St", "Oak Ave", "Elm Dr", "Park Blvd", "Cedar Ln"])}, ${pick(["New York", "Los Angeles", "Chicago", "Houston", "Phoenix"])}`;
      if (n === "city")
        return pick(["New York", "Los Angeles", "Chicago", "Houston", "Phoenix"]);
      if (n === "phone" || n === "phone_number" || n === "mobile")
        return `555-${String(1000 + i * 101).padStart(4, "0")}`;
      if (n === "description" || n === "notes" || n === "bio")
        return `Description ${i + 1}`;
      if (n === "title")
        return `Title ${i + 1}`;
      if (n === "code" || n === "reference_code")
        return `CODE-${String(i + 1).padStart(3, "0")}`;
      if (n === "score" || n === "grade_value")
        return String(70 + i * 5);
      if (n === "capacity" || n === "max_students")
        return String(20 + i * 5);
      if (n === "room_number")
        return `10${i + 1}`;
      if (n === "year" || n === "academic_year")
        return String(2024 + i);
      if (n === "section")
        return String.fromCharCode(65 + i);
      return `Sample ${i + 1}`;
    });
  }
}
var import_handlebars, RUST_KEYWORDS;
var init_loader = __esm(() => {
  init_types2();
  init_utils();
  init_child_process();
  init_fs();
  init_path();
  import_handlebars = __toESM(require_handlebars(), 1);
  RUST_KEYWORDS = new Set([
    "as",
    "async",
    "await",
    "break",
    "const",
    "continue",
    "dyn",
    "else",
    "enum",
    "extern",
    "false",
    "fn",
    "for",
    "if",
    "impl",
    "in",
    "let",
    "loop",
    "match",
    "mod",
    "move",
    "mut",
    "pub",
    "ref",
    "return",
    "static",
    "struct",
    "trait",
    "true",
    "try",
    "type",
    "unsafe",
    "use",
    "where",
    "while",
    "abstract",
    "become",
    "box",
    "do",
    "final",
    "macro",
    "override",
    "priv",
    "typeof",
    "unsized",
    "virtual",
    "yield",
    "gen"
  ]);
});

// node:buffer
var lookup = [];
var revLookup = [];
var code = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
for (i = 0, len = code.length;i < len; ++i)
  lookup[i] = code[i], revLookup[code.charCodeAt(i)] = i;
var i;
var len;
revLookup[45] = 62;
revLookup[95] = 63;
function getLens(b64) {
  var len2 = b64.length;
  if (len2 % 4 > 0)
    throw Error("Invalid string. Length must be a multiple of 4");
  var validLen = b64.indexOf("=");
  if (validLen === -1)
    validLen = len2;
  var placeHoldersLen = validLen === len2 ? 0 : 4 - validLen % 4;
  return [validLen, placeHoldersLen];
}
function _byteLength(validLen, placeHoldersLen) {
  return (validLen + placeHoldersLen) * 3 / 4 - placeHoldersLen;
}
function toByteArray(b64) {
  var tmp, lens = getLens(b64), validLen = lens[0], placeHoldersLen = lens[1], arr = new Uint8Array(_byteLength(validLen, placeHoldersLen)), curByte = 0, len2 = placeHoldersLen > 0 ? validLen - 4 : validLen, i2;
  for (i2 = 0;i2 < len2; i2 += 4)
    tmp = revLookup[b64.charCodeAt(i2)] << 18 | revLookup[b64.charCodeAt(i2 + 1)] << 12 | revLookup[b64.charCodeAt(i2 + 2)] << 6 | revLookup[b64.charCodeAt(i2 + 3)], arr[curByte++] = tmp >> 16 & 255, arr[curByte++] = tmp >> 8 & 255, arr[curByte++] = tmp & 255;
  if (placeHoldersLen === 2)
    tmp = revLookup[b64.charCodeAt(i2)] << 2 | revLookup[b64.charCodeAt(i2 + 1)] >> 4, arr[curByte++] = tmp & 255;
  if (placeHoldersLen === 1)
    tmp = revLookup[b64.charCodeAt(i2)] << 10 | revLookup[b64.charCodeAt(i2 + 1)] << 4 | revLookup[b64.charCodeAt(i2 + 2)] >> 2, arr[curByte++] = tmp >> 8 & 255, arr[curByte++] = tmp & 255;
  return arr;
}
function tripletToBase64(num) {
  return lookup[num >> 18 & 63] + lookup[num >> 12 & 63] + lookup[num >> 6 & 63] + lookup[num & 63];
}
function encodeChunk(uint8, start, end) {
  var tmp, output = [];
  for (var i2 = start;i2 < end; i2 += 3)
    tmp = (uint8[i2] << 16 & 16711680) + (uint8[i2 + 1] << 8 & 65280) + (uint8[i2 + 2] & 255), output.push(tripletToBase64(tmp));
  return output.join("");
}
function fromByteArray(uint8) {
  var tmp, len2 = uint8.length, extraBytes = len2 % 3, parts = [], maxChunkLength = 16383;
  for (var i2 = 0, len22 = len2 - extraBytes;i2 < len22; i2 += maxChunkLength)
    parts.push(encodeChunk(uint8, i2, i2 + maxChunkLength > len22 ? len22 : i2 + maxChunkLength));
  if (extraBytes === 1)
    tmp = uint8[len2 - 1], parts.push(lookup[tmp >> 2] + lookup[tmp << 4 & 63] + "==");
  else if (extraBytes === 2)
    tmp = (uint8[len2 - 2] << 8) + uint8[len2 - 1], parts.push(lookup[tmp >> 10] + lookup[tmp >> 4 & 63] + lookup[tmp << 2 & 63] + "=");
  return parts.join("");
}
function read(buffer, offset, isLE, mLen, nBytes) {
  var e, m, eLen = nBytes * 8 - mLen - 1, eMax = (1 << eLen) - 1, eBias = eMax >> 1, nBits = -7, i2 = isLE ? nBytes - 1 : 0, d = isLE ? -1 : 1, s = buffer[offset + i2];
  i2 += d, e = s & (1 << -nBits) - 1, s >>= -nBits, nBits += eLen;
  for (;nBits > 0; e = e * 256 + buffer[offset + i2], i2 += d, nBits -= 8)
    ;
  m = e & (1 << -nBits) - 1, e >>= -nBits, nBits += mLen;
  for (;nBits > 0; m = m * 256 + buffer[offset + i2], i2 += d, nBits -= 8)
    ;
  if (e === 0)
    e = 1 - eBias;
  else if (e === eMax)
    return m ? NaN : (s ? -1 : 1) * (1 / 0);
  else
    m = m + Math.pow(2, mLen), e = e - eBias;
  return (s ? -1 : 1) * m * Math.pow(2, e - mLen);
}
function write(buffer, value, offset, isLE, mLen, nBytes) {
  var e, m, c, eLen = nBytes * 8 - mLen - 1, eMax = (1 << eLen) - 1, eBias = eMax >> 1, rt = mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0, i2 = isLE ? 0 : nBytes - 1, d = isLE ? 1 : -1, s = value < 0 || value === 0 && 1 / value < 0 ? 1 : 0;
  if (value = Math.abs(value), isNaN(value) || value === 1 / 0)
    m = isNaN(value) ? 1 : 0, e = eMax;
  else {
    if (e = Math.floor(Math.log(value) / Math.LN2), value * (c = Math.pow(2, -e)) < 1)
      e--, c *= 2;
    if (e + eBias >= 1)
      value += rt / c;
    else
      value += rt * Math.pow(2, 1 - eBias);
    if (value * c >= 2)
      e++, c /= 2;
    if (e + eBias >= eMax)
      m = 0, e = eMax;
    else if (e + eBias >= 1)
      m = (value * c - 1) * Math.pow(2, mLen), e = e + eBias;
    else
      m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen), e = 0;
  }
  for (;mLen >= 8; buffer[offset + i2] = m & 255, i2 += d, m /= 256, mLen -= 8)
    ;
  e = e << mLen | m, eLen += mLen;
  for (;eLen > 0; buffer[offset + i2] = e & 255, i2 += d, e /= 256, eLen -= 8)
    ;
  buffer[offset + i2 - d] |= s * 128;
}
var customInspectSymbol = typeof Symbol === "function" && typeof Symbol.for === "function" ? Symbol.for("nodejs.util.inspect.custom") : null;
var INSPECT_MAX_BYTES = 50;
var kMaxLength = 2147483647;
var btoa2 = globalThis.btoa;
var atob2 = globalThis.atob;
var File = globalThis.File;
var Blob = globalThis.Blob;
function createBuffer(length) {
  if (length > kMaxLength)
    throw RangeError('The value "' + length + '" is invalid for option "size"');
  let buf = new Uint8Array(length);
  return Object.setPrototypeOf(buf, Buffer2.prototype), buf;
}
function E(sym, getMessage, Base) {
  return class extends Base {
    constructor() {
      super();
      Object.defineProperty(this, "message", { value: getMessage.apply(this, arguments), writable: true, configurable: true }), this.name = `${this.name} [${sym}]`, this.stack, delete this.name;
    }
    get code() {
      return sym;
    }
    set code(value) {
      Object.defineProperty(this, "code", { configurable: true, enumerable: true, value, writable: true });
    }
    toString() {
      return `${this.name} [${sym}]: ${this.message}`;
    }
  };
}
var ERR_BUFFER_OUT_OF_BOUNDS = E("ERR_BUFFER_OUT_OF_BOUNDS", function(name) {
  if (name)
    return `${name} is outside of buffer bounds`;
  return "Attempt to access memory outside buffer bounds";
}, RangeError);
var ERR_INVALID_ARG_TYPE = E("ERR_INVALID_ARG_TYPE", function(name, actual) {
  return `The "${name}" argument must be of type number. Received type ${typeof actual}`;
}, TypeError);
var ERR_OUT_OF_RANGE = E("ERR_OUT_OF_RANGE", function(str, range, input) {
  let msg = `The value of "${str}" is out of range.`, received = input;
  if (Number.isInteger(input) && Math.abs(input) > 4294967296)
    received = addNumericalSeparator(String(input));
  else if (typeof input === "bigint") {
    if (received = String(input), input > BigInt(2) ** BigInt(32) || input < -(BigInt(2) ** BigInt(32)))
      received = addNumericalSeparator(received);
    received += "n";
  }
  return msg += ` It must be ${range}. Received ${received}`, msg;
}, RangeError);
function Buffer2(arg, encodingOrOffset, length) {
  if (typeof arg === "number") {
    if (typeof encodingOrOffset === "string")
      throw TypeError('The "string" argument must be of type string. Received type number');
    return allocUnsafe(arg);
  }
  return from(arg, encodingOrOffset, length);
}
Object.defineProperty(Buffer2.prototype, "parent", { enumerable: true, get: function() {
  if (!Buffer2.isBuffer(this))
    return;
  return this.buffer;
} });
Object.defineProperty(Buffer2.prototype, "offset", { enumerable: true, get: function() {
  if (!Buffer2.isBuffer(this))
    return;
  return this.byteOffset;
} });
Buffer2.poolSize = 8192;
function from(value, encodingOrOffset, length) {
  if (typeof value === "string")
    return fromString(value, encodingOrOffset);
  if (ArrayBuffer.isView(value))
    return fromArrayView(value);
  if (value == null)
    throw TypeError("The first argument must be one of type string, Buffer, ArrayBuffer, Array, or Array-like Object. Received type " + typeof value);
  if (isInstance(value, ArrayBuffer) || value && isInstance(value.buffer, ArrayBuffer))
    return fromArrayBuffer(value, encodingOrOffset, length);
  if (typeof SharedArrayBuffer < "u" && (isInstance(value, SharedArrayBuffer) || value && isInstance(value.buffer, SharedArrayBuffer)))
    return fromArrayBuffer(value, encodingOrOffset, length);
  if (typeof value === "number")
    throw TypeError('The "value" argument must not be of type number. Received type number');
  let valueOf = value.valueOf && value.valueOf();
  if (valueOf != null && valueOf !== value)
    return Buffer2.from(valueOf, encodingOrOffset, length);
  let b = fromObject(value);
  if (b)
    return b;
  if (typeof Symbol < "u" && Symbol.toPrimitive != null && typeof value[Symbol.toPrimitive] === "function")
    return Buffer2.from(value[Symbol.toPrimitive]("string"), encodingOrOffset, length);
  throw TypeError("The first argument must be one of type string, Buffer, ArrayBuffer, Array, or Array-like Object. Received type " + typeof value);
}
Buffer2.from = function(value, encodingOrOffset, length) {
  return from(value, encodingOrOffset, length);
};
Object.setPrototypeOf(Buffer2.prototype, Uint8Array.prototype);
Object.setPrototypeOf(Buffer2, Uint8Array);
function assertSize(size) {
  if (typeof size !== "number")
    throw TypeError('"size" argument must be of type number');
  else if (size < 0)
    throw RangeError('The value "' + size + '" is invalid for option "size"');
}
function alloc(size, fill, encoding) {
  if (assertSize(size), size <= 0)
    return createBuffer(size);
  if (fill !== undefined)
    return typeof encoding === "string" ? createBuffer(size).fill(fill, encoding) : createBuffer(size).fill(fill);
  return createBuffer(size);
}
Buffer2.alloc = function(size, fill, encoding) {
  return alloc(size, fill, encoding);
};
function allocUnsafe(size) {
  return assertSize(size), createBuffer(size < 0 ? 0 : checked(size) | 0);
}
Buffer2.allocUnsafe = function(size) {
  return allocUnsafe(size);
};
Buffer2.allocUnsafeSlow = function(size) {
  return allocUnsafe(size);
};
function fromString(string, encoding) {
  if (typeof encoding !== "string" || encoding === "")
    encoding = "utf8";
  if (!Buffer2.isEncoding(encoding))
    throw TypeError("Unknown encoding: " + encoding);
  let length = byteLength(string, encoding) | 0, buf = createBuffer(length), actual = buf.write(string, encoding);
  if (actual !== length)
    buf = buf.slice(0, actual);
  return buf;
}
function fromArrayLike(array) {
  let length = array.length < 0 ? 0 : checked(array.length) | 0, buf = createBuffer(length);
  for (let i2 = 0;i2 < length; i2 += 1)
    buf[i2] = array[i2] & 255;
  return buf;
}
function fromArrayView(arrayView) {
  if (isInstance(arrayView, Uint8Array)) {
    let copy = new Uint8Array(arrayView);
    return fromArrayBuffer(copy.buffer, copy.byteOffset, copy.byteLength);
  }
  return fromArrayLike(arrayView);
}
function fromArrayBuffer(array, byteOffset, length) {
  if (byteOffset < 0 || array.byteLength < byteOffset)
    throw RangeError('"offset" is outside of buffer bounds');
  if (array.byteLength < byteOffset + (length || 0))
    throw RangeError('"length" is outside of buffer bounds');
  let buf;
  if (byteOffset === undefined && length === undefined)
    buf = new Uint8Array(array);
  else if (length === undefined)
    buf = new Uint8Array(array, byteOffset);
  else
    buf = new Uint8Array(array, byteOffset, length);
  return Object.setPrototypeOf(buf, Buffer2.prototype), buf;
}
function fromObject(obj) {
  if (Buffer2.isBuffer(obj)) {
    let len2 = checked(obj.length) | 0, buf = createBuffer(len2);
    if (buf.length === 0)
      return buf;
    return obj.copy(buf, 0, 0, len2), buf;
  }
  if (obj.length !== undefined) {
    if (typeof obj.length !== "number" || Number.isNaN(obj.length))
      return createBuffer(0);
    return fromArrayLike(obj);
  }
  if (obj.type === "Buffer" && Array.isArray(obj.data))
    return fromArrayLike(obj.data);
}
function checked(length) {
  if (length >= kMaxLength)
    throw RangeError("Attempt to allocate Buffer larger than maximum size: 0x" + kMaxLength.toString(16) + " bytes");
  return length | 0;
}
Buffer2.isBuffer = function(b) {
  return b != null && b._isBuffer === true && b !== Buffer2.prototype;
};
Buffer2.compare = function(a, b) {
  if (isInstance(a, Uint8Array))
    a = Buffer2.from(a, a.offset, a.byteLength);
  if (isInstance(b, Uint8Array))
    b = Buffer2.from(b, b.offset, b.byteLength);
  if (!Buffer2.isBuffer(a) || !Buffer2.isBuffer(b))
    throw TypeError('The "buf1", "buf2" arguments must be one of type Buffer or Uint8Array');
  if (a === b)
    return 0;
  let x = a.length, y = b.length;
  for (let i2 = 0, len2 = Math.min(x, y);i2 < len2; ++i2)
    if (a[i2] !== b[i2]) {
      x = a[i2], y = b[i2];
      break;
    }
  if (x < y)
    return -1;
  if (y < x)
    return 1;
  return 0;
};
Buffer2.isEncoding = function(encoding) {
  switch (String(encoding).toLowerCase()) {
    case "hex":
    case "utf8":
    case "utf-8":
    case "ascii":
    case "latin1":
    case "binary":
    case "base64":
    case "ucs2":
    case "ucs-2":
    case "utf16le":
    case "utf-16le":
      return true;
    default:
      return false;
  }
};
Buffer2.concat = function(list, length) {
  if (!Array.isArray(list))
    throw TypeError('"list" argument must be an Array of Buffers');
  if (list.length === 0)
    return Buffer2.alloc(0);
  let i2;
  if (length === undefined) {
    length = 0;
    for (i2 = 0;i2 < list.length; ++i2)
      length += list[i2].length;
  }
  let buffer = Buffer2.allocUnsafe(length), pos = 0;
  for (i2 = 0;i2 < list.length; ++i2) {
    let buf = list[i2];
    if (isInstance(buf, Uint8Array))
      if (pos + buf.length > buffer.length) {
        if (!Buffer2.isBuffer(buf))
          buf = Buffer2.from(buf);
        buf.copy(buffer, pos);
      } else
        Uint8Array.prototype.set.call(buffer, buf, pos);
    else if (!Buffer2.isBuffer(buf))
      throw TypeError('"list" argument must be an Array of Buffers');
    else
      buf.copy(buffer, pos);
    pos += buf.length;
  }
  return buffer;
};
function byteLength(string, encoding) {
  if (Buffer2.isBuffer(string))
    return string.length;
  if (ArrayBuffer.isView(string) || isInstance(string, ArrayBuffer))
    return string.byteLength;
  if (typeof string !== "string")
    throw TypeError('The "string" argument must be one of type string, Buffer, or ArrayBuffer. Received type ' + typeof string);
  let len2 = string.length, mustMatch = arguments.length > 2 && arguments[2] === true;
  if (!mustMatch && len2 === 0)
    return 0;
  let loweredCase = false;
  for (;; )
    switch (encoding) {
      case "ascii":
      case "latin1":
      case "binary":
        return len2;
      case "utf8":
      case "utf-8":
        return utf8ToBytes(string).length;
      case "ucs2":
      case "ucs-2":
      case "utf16le":
      case "utf-16le":
        return len2 * 2;
      case "hex":
        return len2 >>> 1;
      case "base64":
        return base64ToBytes(string).length;
      default:
        if (loweredCase)
          return mustMatch ? -1 : utf8ToBytes(string).length;
        encoding = ("" + encoding).toLowerCase(), loweredCase = true;
    }
}
Buffer2.byteLength = byteLength;
function slowToString(encoding, start, end) {
  let loweredCase = false;
  if (start === undefined || start < 0)
    start = 0;
  if (start > this.length)
    return "";
  if (end === undefined || end > this.length)
    end = this.length;
  if (end <= 0)
    return "";
  if (end >>>= 0, start >>>= 0, end <= start)
    return "";
  if (!encoding)
    encoding = "utf8";
  while (true)
    switch (encoding) {
      case "hex":
        return hexSlice(this, start, end);
      case "utf8":
      case "utf-8":
        return utf8Slice(this, start, end);
      case "ascii":
        return asciiSlice(this, start, end);
      case "latin1":
      case "binary":
        return latin1Slice(this, start, end);
      case "base64":
        return base64Slice(this, start, end);
      case "ucs2":
      case "ucs-2":
      case "utf16le":
      case "utf-16le":
        return utf16leSlice(this, start, end);
      default:
        if (loweredCase)
          throw TypeError("Unknown encoding: " + encoding);
        encoding = (encoding + "").toLowerCase(), loweredCase = true;
    }
}
Buffer2.prototype._isBuffer = true;
function swap(b, n, m) {
  let i2 = b[n];
  b[n] = b[m], b[m] = i2;
}
Buffer2.prototype.swap16 = function() {
  let len2 = this.length;
  if (len2 % 2 !== 0)
    throw RangeError("Buffer size must be a multiple of 16-bits");
  for (let i2 = 0;i2 < len2; i2 += 2)
    swap(this, i2, i2 + 1);
  return this;
};
Buffer2.prototype.swap32 = function() {
  let len2 = this.length;
  if (len2 % 4 !== 0)
    throw RangeError("Buffer size must be a multiple of 32-bits");
  for (let i2 = 0;i2 < len2; i2 += 4)
    swap(this, i2, i2 + 3), swap(this, i2 + 1, i2 + 2);
  return this;
};
Buffer2.prototype.swap64 = function() {
  let len2 = this.length;
  if (len2 % 8 !== 0)
    throw RangeError("Buffer size must be a multiple of 64-bits");
  for (let i2 = 0;i2 < len2; i2 += 8)
    swap(this, i2, i2 + 7), swap(this, i2 + 1, i2 + 6), swap(this, i2 + 2, i2 + 5), swap(this, i2 + 3, i2 + 4);
  return this;
};
Buffer2.prototype.toString = function() {
  let length = this.length;
  if (length === 0)
    return "";
  if (arguments.length === 0)
    return utf8Slice(this, 0, length);
  return slowToString.apply(this, arguments);
};
Buffer2.prototype.toLocaleString = Buffer2.prototype.toString;
Buffer2.prototype.equals = function(b) {
  if (!Buffer2.isBuffer(b))
    throw TypeError("Argument must be a Buffer");
  if (this === b)
    return true;
  return Buffer2.compare(this, b) === 0;
};
Buffer2.prototype.inspect = function() {
  let str = "", max = INSPECT_MAX_BYTES;
  if (str = this.toString("hex", 0, max).replace(/(.{2})/g, "$1 ").trim(), this.length > max)
    str += " ... ";
  return "<Buffer " + str + ">";
};
if (customInspectSymbol)
  Buffer2.prototype[customInspectSymbol] = Buffer2.prototype.inspect;
Buffer2.prototype.compare = function(target, start, end, thisStart, thisEnd) {
  if (isInstance(target, Uint8Array))
    target = Buffer2.from(target, target.offset, target.byteLength);
  if (!Buffer2.isBuffer(target))
    throw TypeError('The "target" argument must be one of type Buffer or Uint8Array. Received type ' + typeof target);
  if (start === undefined)
    start = 0;
  if (end === undefined)
    end = target ? target.length : 0;
  if (thisStart === undefined)
    thisStart = 0;
  if (thisEnd === undefined)
    thisEnd = this.length;
  if (start < 0 || end > target.length || thisStart < 0 || thisEnd > this.length)
    throw RangeError("out of range index");
  if (thisStart >= thisEnd && start >= end)
    return 0;
  if (thisStart >= thisEnd)
    return -1;
  if (start >= end)
    return 1;
  if (start >>>= 0, end >>>= 0, thisStart >>>= 0, thisEnd >>>= 0, this === target)
    return 0;
  let x = thisEnd - thisStart, y = end - start, len2 = Math.min(x, y), thisCopy = this.slice(thisStart, thisEnd), targetCopy = target.slice(start, end);
  for (let i2 = 0;i2 < len2; ++i2)
    if (thisCopy[i2] !== targetCopy[i2]) {
      x = thisCopy[i2], y = targetCopy[i2];
      break;
    }
  if (x < y)
    return -1;
  if (y < x)
    return 1;
  return 0;
};
function bidirectionalIndexOf(buffer, val, byteOffset, encoding, dir) {
  if (buffer.length === 0)
    return -1;
  if (typeof byteOffset === "string")
    encoding = byteOffset, byteOffset = 0;
  else if (byteOffset > 2147483647)
    byteOffset = 2147483647;
  else if (byteOffset < -2147483648)
    byteOffset = -2147483648;
  if (byteOffset = +byteOffset, Number.isNaN(byteOffset))
    byteOffset = dir ? 0 : buffer.length - 1;
  if (byteOffset < 0)
    byteOffset = buffer.length + byteOffset;
  if (byteOffset >= buffer.length)
    if (dir)
      return -1;
    else
      byteOffset = buffer.length - 1;
  else if (byteOffset < 0)
    if (dir)
      byteOffset = 0;
    else
      return -1;
  if (typeof val === "string")
    val = Buffer2.from(val, encoding);
  if (Buffer2.isBuffer(val)) {
    if (val.length === 0)
      return -1;
    return arrayIndexOf(buffer, val, byteOffset, encoding, dir);
  } else if (typeof val === "number") {
    if (val = val & 255, typeof Uint8Array.prototype.indexOf === "function")
      if (dir)
        return Uint8Array.prototype.indexOf.call(buffer, val, byteOffset);
      else
        return Uint8Array.prototype.lastIndexOf.call(buffer, val, byteOffset);
    return arrayIndexOf(buffer, [val], byteOffset, encoding, dir);
  }
  throw TypeError("val must be string, number or Buffer");
}
function arrayIndexOf(arr, val, byteOffset, encoding, dir) {
  let indexSize = 1, arrLength = arr.length, valLength = val.length;
  if (encoding !== undefined) {
    if (encoding = String(encoding).toLowerCase(), encoding === "ucs2" || encoding === "ucs-2" || encoding === "utf16le" || encoding === "utf-16le") {
      if (arr.length < 2 || val.length < 2)
        return -1;
      indexSize = 2, arrLength /= 2, valLength /= 2, byteOffset /= 2;
    }
  }
  function read2(buf, i3) {
    if (indexSize === 1)
      return buf[i3];
    else
      return buf.readUInt16BE(i3 * indexSize);
  }
  let i2;
  if (dir) {
    let foundIndex = -1;
    for (i2 = byteOffset;i2 < arrLength; i2++)
      if (read2(arr, i2) === read2(val, foundIndex === -1 ? 0 : i2 - foundIndex)) {
        if (foundIndex === -1)
          foundIndex = i2;
        if (i2 - foundIndex + 1 === valLength)
          return foundIndex * indexSize;
      } else {
        if (foundIndex !== -1)
          i2 -= i2 - foundIndex;
        foundIndex = -1;
      }
  } else {
    if (byteOffset + valLength > arrLength)
      byteOffset = arrLength - valLength;
    for (i2 = byteOffset;i2 >= 0; i2--) {
      let found = true;
      for (let j = 0;j < valLength; j++)
        if (read2(arr, i2 + j) !== read2(val, j)) {
          found = false;
          break;
        }
      if (found)
        return i2;
    }
  }
  return -1;
}
Buffer2.prototype.includes = function(val, byteOffset, encoding) {
  return this.indexOf(val, byteOffset, encoding) !== -1;
};
Buffer2.prototype.indexOf = function(val, byteOffset, encoding) {
  return bidirectionalIndexOf(this, val, byteOffset, encoding, true);
};
Buffer2.prototype.lastIndexOf = function(val, byteOffset, encoding) {
  return bidirectionalIndexOf(this, val, byteOffset, encoding, false);
};
function hexWrite(buf, string, offset, length) {
  offset = Number(offset) || 0;
  let remaining = buf.length - offset;
  if (!length)
    length = remaining;
  else if (length = Number(length), length > remaining)
    length = remaining;
  let strLen = string.length;
  if (length > strLen / 2)
    length = strLen / 2;
  let i2;
  for (i2 = 0;i2 < length; ++i2) {
    let parsed = parseInt(string.substr(i2 * 2, 2), 16);
    if (Number.isNaN(parsed))
      return i2;
    buf[offset + i2] = parsed;
  }
  return i2;
}
function utf8Write(buf, string, offset, length) {
  return blitBuffer(utf8ToBytes(string, buf.length - offset), buf, offset, length);
}
function asciiWrite(buf, string, offset, length) {
  return blitBuffer(asciiToBytes(string), buf, offset, length);
}
function base64Write(buf, string, offset, length) {
  return blitBuffer(base64ToBytes(string), buf, offset, length);
}
function ucs2Write(buf, string, offset, length) {
  return blitBuffer(utf16leToBytes(string, buf.length - offset), buf, offset, length);
}
Buffer2.prototype.write = function(string, offset, length, encoding) {
  if (offset === undefined)
    encoding = "utf8", length = this.length, offset = 0;
  else if (length === undefined && typeof offset === "string")
    encoding = offset, length = this.length, offset = 0;
  else if (isFinite(offset))
    if (offset = offset >>> 0, isFinite(length)) {
      if (length = length >>> 0, encoding === undefined)
        encoding = "utf8";
    } else
      encoding = length, length = undefined;
  else
    throw Error("Buffer.write(string, encoding, offset[, length]) is no longer supported");
  let remaining = this.length - offset;
  if (length === undefined || length > remaining)
    length = remaining;
  if (string.length > 0 && (length < 0 || offset < 0) || offset > this.length)
    throw RangeError("Attempt to write outside buffer bounds");
  if (!encoding)
    encoding = "utf8";
  let loweredCase = false;
  for (;; )
    switch (encoding) {
      case "hex":
        return hexWrite(this, string, offset, length);
      case "utf8":
      case "utf-8":
        return utf8Write(this, string, offset, length);
      case "ascii":
      case "latin1":
      case "binary":
        return asciiWrite(this, string, offset, length);
      case "base64":
        return base64Write(this, string, offset, length);
      case "ucs2":
      case "ucs-2":
      case "utf16le":
      case "utf-16le":
        return ucs2Write(this, string, offset, length);
      default:
        if (loweredCase)
          throw TypeError("Unknown encoding: " + encoding);
        encoding = ("" + encoding).toLowerCase(), loweredCase = true;
    }
};
Buffer2.prototype.toJSON = function() {
  return { type: "Buffer", data: Array.prototype.slice.call(this._arr || this, 0) };
};
function base64Slice(buf, start, end) {
  if (start === 0 && end === buf.length)
    return fromByteArray(buf);
  else
    return fromByteArray(buf.slice(start, end));
}
function utf8Slice(buf, start, end) {
  end = Math.min(buf.length, end);
  let res = [], i2 = start;
  while (i2 < end) {
    let firstByte = buf[i2], codePoint = null, bytesPerSequence = firstByte > 239 ? 4 : firstByte > 223 ? 3 : firstByte > 191 ? 2 : 1;
    if (i2 + bytesPerSequence <= end) {
      let secondByte, thirdByte, fourthByte, tempCodePoint;
      switch (bytesPerSequence) {
        case 1:
          if (firstByte < 128)
            codePoint = firstByte;
          break;
        case 2:
          if (secondByte = buf[i2 + 1], (secondByte & 192) === 128) {
            if (tempCodePoint = (firstByte & 31) << 6 | secondByte & 63, tempCodePoint > 127)
              codePoint = tempCodePoint;
          }
          break;
        case 3:
          if (secondByte = buf[i2 + 1], thirdByte = buf[i2 + 2], (secondByte & 192) === 128 && (thirdByte & 192) === 128) {
            if (tempCodePoint = (firstByte & 15) << 12 | (secondByte & 63) << 6 | thirdByte & 63, tempCodePoint > 2047 && (tempCodePoint < 55296 || tempCodePoint > 57343))
              codePoint = tempCodePoint;
          }
          break;
        case 4:
          if (secondByte = buf[i2 + 1], thirdByte = buf[i2 + 2], fourthByte = buf[i2 + 3], (secondByte & 192) === 128 && (thirdByte & 192) === 128 && (fourthByte & 192) === 128) {
            if (tempCodePoint = (firstByte & 15) << 18 | (secondByte & 63) << 12 | (thirdByte & 63) << 6 | fourthByte & 63, tempCodePoint > 65535 && tempCodePoint < 1114112)
              codePoint = tempCodePoint;
          }
      }
    }
    if (codePoint === null)
      codePoint = 65533, bytesPerSequence = 1;
    else if (codePoint > 65535)
      codePoint -= 65536, res.push(codePoint >>> 10 & 1023 | 55296), codePoint = 56320 | codePoint & 1023;
    res.push(codePoint), i2 += bytesPerSequence;
  }
  return decodeCodePointsArray(res);
}
var MAX_ARGUMENTS_LENGTH = 4096;
function decodeCodePointsArray(codePoints) {
  let len2 = codePoints.length;
  if (len2 <= MAX_ARGUMENTS_LENGTH)
    return String.fromCharCode.apply(String, codePoints);
  let res = "", i2 = 0;
  while (i2 < len2)
    res += String.fromCharCode.apply(String, codePoints.slice(i2, i2 += MAX_ARGUMENTS_LENGTH));
  return res;
}
function asciiSlice(buf, start, end) {
  let ret = "";
  end = Math.min(buf.length, end);
  for (let i2 = start;i2 < end; ++i2)
    ret += String.fromCharCode(buf[i2] & 127);
  return ret;
}
function latin1Slice(buf, start, end) {
  let ret = "";
  end = Math.min(buf.length, end);
  for (let i2 = start;i2 < end; ++i2)
    ret += String.fromCharCode(buf[i2]);
  return ret;
}
function hexSlice(buf, start, end) {
  let len2 = buf.length;
  if (!start || start < 0)
    start = 0;
  if (!end || end < 0 || end > len2)
    end = len2;
  let out = "";
  for (let i2 = start;i2 < end; ++i2)
    out += hexSliceLookupTable[buf[i2]];
  return out;
}
function utf16leSlice(buf, start, end) {
  let bytes = buf.slice(start, end), res = "";
  for (let i2 = 0;i2 < bytes.length - 1; i2 += 2)
    res += String.fromCharCode(bytes[i2] + bytes[i2 + 1] * 256);
  return res;
}
Buffer2.prototype.slice = function(start, end) {
  let len2 = this.length;
  if (start = ~~start, end = end === undefined ? len2 : ~~end, start < 0) {
    if (start += len2, start < 0)
      start = 0;
  } else if (start > len2)
    start = len2;
  if (end < 0) {
    if (end += len2, end < 0)
      end = 0;
  } else if (end > len2)
    end = len2;
  if (end < start)
    end = start;
  let newBuf = this.subarray(start, end);
  return Object.setPrototypeOf(newBuf, Buffer2.prototype), newBuf;
};
function checkOffset(offset, ext, length) {
  if (offset % 1 !== 0 || offset < 0)
    throw RangeError("offset is not uint");
  if (offset + ext > length)
    throw RangeError("Trying to access beyond buffer length");
}
Buffer2.prototype.readUintLE = Buffer2.prototype.readUIntLE = function(offset, byteLength2, noAssert) {
  if (offset = offset >>> 0, byteLength2 = byteLength2 >>> 0, !noAssert)
    checkOffset(offset, byteLength2, this.length);
  let val = this[offset], mul = 1, i2 = 0;
  while (++i2 < byteLength2 && (mul *= 256))
    val += this[offset + i2] * mul;
  return val;
};
Buffer2.prototype.readUintBE = Buffer2.prototype.readUIntBE = function(offset, byteLength2, noAssert) {
  if (offset = offset >>> 0, byteLength2 = byteLength2 >>> 0, !noAssert)
    checkOffset(offset, byteLength2, this.length);
  let val = this[offset + --byteLength2], mul = 1;
  while (byteLength2 > 0 && (mul *= 256))
    val += this[offset + --byteLength2] * mul;
  return val;
};
Buffer2.prototype.readUint8 = Buffer2.prototype.readUInt8 = function(offset, noAssert) {
  if (offset = offset >>> 0, !noAssert)
    checkOffset(offset, 1, this.length);
  return this[offset];
};
Buffer2.prototype.readUint16LE = Buffer2.prototype.readUInt16LE = function(offset, noAssert) {
  if (offset = offset >>> 0, !noAssert)
    checkOffset(offset, 2, this.length);
  return this[offset] | this[offset + 1] << 8;
};
Buffer2.prototype.readUint16BE = Buffer2.prototype.readUInt16BE = function(offset, noAssert) {
  if (offset = offset >>> 0, !noAssert)
    checkOffset(offset, 2, this.length);
  return this[offset] << 8 | this[offset + 1];
};
Buffer2.prototype.readUint32LE = Buffer2.prototype.readUInt32LE = function(offset, noAssert) {
  if (offset = offset >>> 0, !noAssert)
    checkOffset(offset, 4, this.length);
  return (this[offset] | this[offset + 1] << 8 | this[offset + 2] << 16) + this[offset + 3] * 16777216;
};
Buffer2.prototype.readUint32BE = Buffer2.prototype.readUInt32BE = function(offset, noAssert) {
  if (offset = offset >>> 0, !noAssert)
    checkOffset(offset, 4, this.length);
  return this[offset] * 16777216 + (this[offset + 1] << 16 | this[offset + 2] << 8 | this[offset + 3]);
};
Buffer2.prototype.readBigUInt64LE = defineBigIntMethod(function(offset) {
  offset = offset >>> 0, validateNumber(offset, "offset");
  let first = this[offset], last = this[offset + 7];
  if (first === undefined || last === undefined)
    boundsError(offset, this.length - 8);
  let lo = first + this[++offset] * 256 + this[++offset] * 65536 + this[++offset] * 16777216, hi = this[++offset] + this[++offset] * 256 + this[++offset] * 65536 + last * 16777216;
  return BigInt(lo) + (BigInt(hi) << BigInt(32));
});
Buffer2.prototype.readBigUInt64BE = defineBigIntMethod(function(offset) {
  offset = offset >>> 0, validateNumber(offset, "offset");
  let first = this[offset], last = this[offset + 7];
  if (first === undefined || last === undefined)
    boundsError(offset, this.length - 8);
  let hi = first * 16777216 + this[++offset] * 65536 + this[++offset] * 256 + this[++offset], lo = this[++offset] * 16777216 + this[++offset] * 65536 + this[++offset] * 256 + last;
  return (BigInt(hi) << BigInt(32)) + BigInt(lo);
});
Buffer2.prototype.readIntLE = function(offset, byteLength2, noAssert) {
  if (offset = offset >>> 0, byteLength2 = byteLength2 >>> 0, !noAssert)
    checkOffset(offset, byteLength2, this.length);
  let val = this[offset], mul = 1, i2 = 0;
  while (++i2 < byteLength2 && (mul *= 256))
    val += this[offset + i2] * mul;
  if (mul *= 128, val >= mul)
    val -= Math.pow(2, 8 * byteLength2);
  return val;
};
Buffer2.prototype.readIntBE = function(offset, byteLength2, noAssert) {
  if (offset = offset >>> 0, byteLength2 = byteLength2 >>> 0, !noAssert)
    checkOffset(offset, byteLength2, this.length);
  let i2 = byteLength2, mul = 1, val = this[offset + --i2];
  while (i2 > 0 && (mul *= 256))
    val += this[offset + --i2] * mul;
  if (mul *= 128, val >= mul)
    val -= Math.pow(2, 8 * byteLength2);
  return val;
};
Buffer2.prototype.readInt8 = function(offset, noAssert) {
  if (offset = offset >>> 0, !noAssert)
    checkOffset(offset, 1, this.length);
  if (!(this[offset] & 128))
    return this[offset];
  return (255 - this[offset] + 1) * -1;
};
Buffer2.prototype.readInt16LE = function(offset, noAssert) {
  if (offset = offset >>> 0, !noAssert)
    checkOffset(offset, 2, this.length);
  let val = this[offset] | this[offset + 1] << 8;
  return val & 32768 ? val | 4294901760 : val;
};
Buffer2.prototype.readInt16BE = function(offset, noAssert) {
  if (offset = offset >>> 0, !noAssert)
    checkOffset(offset, 2, this.length);
  let val = this[offset + 1] | this[offset] << 8;
  return val & 32768 ? val | 4294901760 : val;
};
Buffer2.prototype.readInt32LE = function(offset, noAssert) {
  if (offset = offset >>> 0, !noAssert)
    checkOffset(offset, 4, this.length);
  return this[offset] | this[offset + 1] << 8 | this[offset + 2] << 16 | this[offset + 3] << 24;
};
Buffer2.prototype.readInt32BE = function(offset, noAssert) {
  if (offset = offset >>> 0, !noAssert)
    checkOffset(offset, 4, this.length);
  return this[offset] << 24 | this[offset + 1] << 16 | this[offset + 2] << 8 | this[offset + 3];
};
Buffer2.prototype.readBigInt64LE = defineBigIntMethod(function(offset) {
  offset = offset >>> 0, validateNumber(offset, "offset");
  let first = this[offset], last = this[offset + 7];
  if (first === undefined || last === undefined)
    boundsError(offset, this.length - 8);
  let val = this[offset + 4] + this[offset + 5] * 256 + this[offset + 6] * 65536 + (last << 24);
  return (BigInt(val) << BigInt(32)) + BigInt(first + this[++offset] * 256 + this[++offset] * 65536 + this[++offset] * 16777216);
});
Buffer2.prototype.readBigInt64BE = defineBigIntMethod(function(offset) {
  offset = offset >>> 0, validateNumber(offset, "offset");
  let first = this[offset], last = this[offset + 7];
  if (first === undefined || last === undefined)
    boundsError(offset, this.length - 8);
  let val = (first << 24) + this[++offset] * 65536 + this[++offset] * 256 + this[++offset];
  return (BigInt(val) << BigInt(32)) + BigInt(this[++offset] * 16777216 + this[++offset] * 65536 + this[++offset] * 256 + last);
});
Buffer2.prototype.readFloatLE = function(offset, noAssert) {
  if (offset = offset >>> 0, !noAssert)
    checkOffset(offset, 4, this.length);
  return read(this, offset, true, 23, 4);
};
Buffer2.prototype.readFloatBE = function(offset, noAssert) {
  if (offset = offset >>> 0, !noAssert)
    checkOffset(offset, 4, this.length);
  return read(this, offset, false, 23, 4);
};
Buffer2.prototype.readDoubleLE = function(offset, noAssert) {
  if (offset = offset >>> 0, !noAssert)
    checkOffset(offset, 8, this.length);
  return read(this, offset, true, 52, 8);
};
Buffer2.prototype.readDoubleBE = function(offset, noAssert) {
  if (offset = offset >>> 0, !noAssert)
    checkOffset(offset, 8, this.length);
  return read(this, offset, false, 52, 8);
};
function checkInt(buf, value, offset, ext, max, min) {
  if (!Buffer2.isBuffer(buf))
    throw TypeError('"buffer" argument must be a Buffer instance');
  if (value > max || value < min)
    throw RangeError('"value" argument is out of bounds');
  if (offset + ext > buf.length)
    throw RangeError("Index out of range");
}
Buffer2.prototype.writeUintLE = Buffer2.prototype.writeUIntLE = function(value, offset, byteLength2, noAssert) {
  if (value = +value, offset = offset >>> 0, byteLength2 = byteLength2 >>> 0, !noAssert) {
    let maxBytes = Math.pow(2, 8 * byteLength2) - 1;
    checkInt(this, value, offset, byteLength2, maxBytes, 0);
  }
  let mul = 1, i2 = 0;
  this[offset] = value & 255;
  while (++i2 < byteLength2 && (mul *= 256))
    this[offset + i2] = value / mul & 255;
  return offset + byteLength2;
};
Buffer2.prototype.writeUintBE = Buffer2.prototype.writeUIntBE = function(value, offset, byteLength2, noAssert) {
  if (value = +value, offset = offset >>> 0, byteLength2 = byteLength2 >>> 0, !noAssert) {
    let maxBytes = Math.pow(2, 8 * byteLength2) - 1;
    checkInt(this, value, offset, byteLength2, maxBytes, 0);
  }
  let i2 = byteLength2 - 1, mul = 1;
  this[offset + i2] = value & 255;
  while (--i2 >= 0 && (mul *= 256))
    this[offset + i2] = value / mul & 255;
  return offset + byteLength2;
};
Buffer2.prototype.writeUint8 = Buffer2.prototype.writeUInt8 = function(value, offset, noAssert) {
  if (value = +value, offset = offset >>> 0, !noAssert)
    checkInt(this, value, offset, 1, 255, 0);
  return this[offset] = value & 255, offset + 1;
};
Buffer2.prototype.writeUint16LE = Buffer2.prototype.writeUInt16LE = function(value, offset, noAssert) {
  if (value = +value, offset = offset >>> 0, !noAssert)
    checkInt(this, value, offset, 2, 65535, 0);
  return this[offset] = value & 255, this[offset + 1] = value >>> 8, offset + 2;
};
Buffer2.prototype.writeUint16BE = Buffer2.prototype.writeUInt16BE = function(value, offset, noAssert) {
  if (value = +value, offset = offset >>> 0, !noAssert)
    checkInt(this, value, offset, 2, 65535, 0);
  return this[offset] = value >>> 8, this[offset + 1] = value & 255, offset + 2;
};
Buffer2.prototype.writeUint32LE = Buffer2.prototype.writeUInt32LE = function(value, offset, noAssert) {
  if (value = +value, offset = offset >>> 0, !noAssert)
    checkInt(this, value, offset, 4, 4294967295, 0);
  return this[offset + 3] = value >>> 24, this[offset + 2] = value >>> 16, this[offset + 1] = value >>> 8, this[offset] = value & 255, offset + 4;
};
Buffer2.prototype.writeUint32BE = Buffer2.prototype.writeUInt32BE = function(value, offset, noAssert) {
  if (value = +value, offset = offset >>> 0, !noAssert)
    checkInt(this, value, offset, 4, 4294967295, 0);
  return this[offset] = value >>> 24, this[offset + 1] = value >>> 16, this[offset + 2] = value >>> 8, this[offset + 3] = value & 255, offset + 4;
};
function wrtBigUInt64LE(buf, value, offset, min, max) {
  checkIntBI(value, min, max, buf, offset, 7);
  let lo = Number(value & BigInt(4294967295));
  buf[offset++] = lo, lo = lo >> 8, buf[offset++] = lo, lo = lo >> 8, buf[offset++] = lo, lo = lo >> 8, buf[offset++] = lo;
  let hi = Number(value >> BigInt(32) & BigInt(4294967295));
  return buf[offset++] = hi, hi = hi >> 8, buf[offset++] = hi, hi = hi >> 8, buf[offset++] = hi, hi = hi >> 8, buf[offset++] = hi, offset;
}
function wrtBigUInt64BE(buf, value, offset, min, max) {
  checkIntBI(value, min, max, buf, offset, 7);
  let lo = Number(value & BigInt(4294967295));
  buf[offset + 7] = lo, lo = lo >> 8, buf[offset + 6] = lo, lo = lo >> 8, buf[offset + 5] = lo, lo = lo >> 8, buf[offset + 4] = lo;
  let hi = Number(value >> BigInt(32) & BigInt(4294967295));
  return buf[offset + 3] = hi, hi = hi >> 8, buf[offset + 2] = hi, hi = hi >> 8, buf[offset + 1] = hi, hi = hi >> 8, buf[offset] = hi, offset + 8;
}
Buffer2.prototype.writeBigUInt64LE = defineBigIntMethod(function(value, offset = 0) {
  return wrtBigUInt64LE(this, value, offset, BigInt(0), BigInt("0xffffffffffffffff"));
});
Buffer2.prototype.writeBigUInt64BE = defineBigIntMethod(function(value, offset = 0) {
  return wrtBigUInt64BE(this, value, offset, BigInt(0), BigInt("0xffffffffffffffff"));
});
Buffer2.prototype.writeIntLE = function(value, offset, byteLength2, noAssert) {
  if (value = +value, offset = offset >>> 0, !noAssert) {
    let limit = Math.pow(2, 8 * byteLength2 - 1);
    checkInt(this, value, offset, byteLength2, limit - 1, -limit);
  }
  let i2 = 0, mul = 1, sub = 0;
  this[offset] = value & 255;
  while (++i2 < byteLength2 && (mul *= 256)) {
    if (value < 0 && sub === 0 && this[offset + i2 - 1] !== 0)
      sub = 1;
    this[offset + i2] = (value / mul >> 0) - sub & 255;
  }
  return offset + byteLength2;
};
Buffer2.prototype.writeIntBE = function(value, offset, byteLength2, noAssert) {
  if (value = +value, offset = offset >>> 0, !noAssert) {
    let limit = Math.pow(2, 8 * byteLength2 - 1);
    checkInt(this, value, offset, byteLength2, limit - 1, -limit);
  }
  let i2 = byteLength2 - 1, mul = 1, sub = 0;
  this[offset + i2] = value & 255;
  while (--i2 >= 0 && (mul *= 256)) {
    if (value < 0 && sub === 0 && this[offset + i2 + 1] !== 0)
      sub = 1;
    this[offset + i2] = (value / mul >> 0) - sub & 255;
  }
  return offset + byteLength2;
};
Buffer2.prototype.writeInt8 = function(value, offset, noAssert) {
  if (value = +value, offset = offset >>> 0, !noAssert)
    checkInt(this, value, offset, 1, 127, -128);
  if (value < 0)
    value = 255 + value + 1;
  return this[offset] = value & 255, offset + 1;
};
Buffer2.prototype.writeInt16LE = function(value, offset, noAssert) {
  if (value = +value, offset = offset >>> 0, !noAssert)
    checkInt(this, value, offset, 2, 32767, -32768);
  return this[offset] = value & 255, this[offset + 1] = value >>> 8, offset + 2;
};
Buffer2.prototype.writeInt16BE = function(value, offset, noAssert) {
  if (value = +value, offset = offset >>> 0, !noAssert)
    checkInt(this, value, offset, 2, 32767, -32768);
  return this[offset] = value >>> 8, this[offset + 1] = value & 255, offset + 2;
};
Buffer2.prototype.writeInt32LE = function(value, offset, noAssert) {
  if (value = +value, offset = offset >>> 0, !noAssert)
    checkInt(this, value, offset, 4, 2147483647, -2147483648);
  return this[offset] = value & 255, this[offset + 1] = value >>> 8, this[offset + 2] = value >>> 16, this[offset + 3] = value >>> 24, offset + 4;
};
Buffer2.prototype.writeInt32BE = function(value, offset, noAssert) {
  if (value = +value, offset = offset >>> 0, !noAssert)
    checkInt(this, value, offset, 4, 2147483647, -2147483648);
  if (value < 0)
    value = 4294967295 + value + 1;
  return this[offset] = value >>> 24, this[offset + 1] = value >>> 16, this[offset + 2] = value >>> 8, this[offset + 3] = value & 255, offset + 4;
};
Buffer2.prototype.writeBigInt64LE = defineBigIntMethod(function(value, offset = 0) {
  return wrtBigUInt64LE(this, value, offset, -BigInt("0x8000000000000000"), BigInt("0x7fffffffffffffff"));
});
Buffer2.prototype.writeBigInt64BE = defineBigIntMethod(function(value, offset = 0) {
  return wrtBigUInt64BE(this, value, offset, -BigInt("0x8000000000000000"), BigInt("0x7fffffffffffffff"));
});
function checkIEEE754(buf, value, offset, ext, max, min) {
  if (offset + ext > buf.length)
    throw RangeError("Index out of range");
  if (offset < 0)
    throw RangeError("Index out of range");
}
function writeFloat(buf, value, offset, littleEndian, noAssert) {
  if (value = +value, offset = offset >>> 0, !noAssert)
    checkIEEE754(buf, value, offset, 4, 340282346638528860000000000000000000000, -340282346638528860000000000000000000000);
  return write(buf, value, offset, littleEndian, 23, 4), offset + 4;
}
Buffer2.prototype.writeFloatLE = function(value, offset, noAssert) {
  return writeFloat(this, value, offset, true, noAssert);
};
Buffer2.prototype.writeFloatBE = function(value, offset, noAssert) {
  return writeFloat(this, value, offset, false, noAssert);
};
function writeDouble(buf, value, offset, littleEndian, noAssert) {
  if (value = +value, offset = offset >>> 0, !noAssert)
    checkIEEE754(buf, value, offset, 8, 179769313486231570000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000, -179769313486231570000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000);
  return write(buf, value, offset, littleEndian, 52, 8), offset + 8;
}
Buffer2.prototype.writeDoubleLE = function(value, offset, noAssert) {
  return writeDouble(this, value, offset, true, noAssert);
};
Buffer2.prototype.writeDoubleBE = function(value, offset, noAssert) {
  return writeDouble(this, value, offset, false, noAssert);
};
Buffer2.prototype.copy = function(target, targetStart, start, end) {
  if (!Buffer2.isBuffer(target))
    throw TypeError("argument should be a Buffer");
  if (!start)
    start = 0;
  if (!end && end !== 0)
    end = this.length;
  if (targetStart >= target.length)
    targetStart = target.length;
  if (!targetStart)
    targetStart = 0;
  if (end > 0 && end < start)
    end = start;
  if (end === start)
    return 0;
  if (target.length === 0 || this.length === 0)
    return 0;
  if (targetStart < 0)
    throw RangeError("targetStart out of bounds");
  if (start < 0 || start >= this.length)
    throw RangeError("Index out of range");
  if (end < 0)
    throw RangeError("sourceEnd out of bounds");
  if (end > this.length)
    end = this.length;
  if (target.length - targetStart < end - start)
    end = target.length - targetStart + start;
  let len2 = end - start;
  if (this === target && typeof Uint8Array.prototype.copyWithin === "function")
    this.copyWithin(targetStart, start, end);
  else
    Uint8Array.prototype.set.call(target, this.subarray(start, end), targetStart);
  return len2;
};
Buffer2.prototype.fill = function(val, start, end, encoding) {
  if (typeof val === "string") {
    if (typeof start === "string")
      encoding = start, start = 0, end = this.length;
    else if (typeof end === "string")
      encoding = end, end = this.length;
    if (encoding !== undefined && typeof encoding !== "string")
      throw TypeError("encoding must be a string");
    if (typeof encoding === "string" && !Buffer2.isEncoding(encoding))
      throw TypeError("Unknown encoding: " + encoding);
    if (val.length === 1) {
      let code2 = val.charCodeAt(0);
      if (encoding === "utf8" && code2 < 128 || encoding === "latin1")
        val = code2;
    }
  } else if (typeof val === "number")
    val = val & 255;
  else if (typeof val === "boolean")
    val = Number(val);
  if (start < 0 || this.length < start || this.length < end)
    throw RangeError("Out of range index");
  if (end <= start)
    return this;
  if (start = start >>> 0, end = end === undefined ? this.length : end >>> 0, !val)
    val = 0;
  let i2;
  if (typeof val === "number")
    for (i2 = start;i2 < end; ++i2)
      this[i2] = val;
  else {
    let bytes = Buffer2.isBuffer(val) ? val : Buffer2.from(val, encoding), len2 = bytes.length;
    if (len2 === 0)
      throw TypeError('The value "' + val + '" is invalid for argument "value"');
    for (i2 = 0;i2 < end - start; ++i2)
      this[i2 + start] = bytes[i2 % len2];
  }
  return this;
};
function addNumericalSeparator(val) {
  let res = "", i2 = val.length, start = val[0] === "-" ? 1 : 0;
  for (;i2 >= start + 4; i2 -= 3)
    res = `_${val.slice(i2 - 3, i2)}${res}`;
  return `${val.slice(0, i2)}${res}`;
}
function checkBounds(buf, offset, byteLength2) {
  if (validateNumber(offset, "offset"), buf[offset] === undefined || buf[offset + byteLength2] === undefined)
    boundsError(offset, buf.length - (byteLength2 + 1));
}
function checkIntBI(value, min, max, buf, offset, byteLength2) {
  if (value > max || value < min) {
    let n = typeof min === "bigint" ? "n" : "", range;
    if (byteLength2 > 3)
      if (min === 0 || min === BigInt(0))
        range = `>= 0${n} and < 2${n} ** ${(byteLength2 + 1) * 8}${n}`;
      else
        range = `>= -(2${n} ** ${(byteLength2 + 1) * 8 - 1}${n}) and < 2 ** ${(byteLength2 + 1) * 8 - 1}${n}`;
    else
      range = `>= ${min}${n} and <= ${max}${n}`;
    throw new ERR_OUT_OF_RANGE("value", range, value);
  }
  checkBounds(buf, offset, byteLength2);
}
function validateNumber(value, name) {
  if (typeof value !== "number")
    throw new ERR_INVALID_ARG_TYPE(name, "number", value);
}
function boundsError(value, length, type) {
  if (Math.floor(value) !== value)
    throw validateNumber(value, type), new ERR_OUT_OF_RANGE(type || "offset", "an integer", value);
  if (length < 0)
    throw new ERR_BUFFER_OUT_OF_BOUNDS;
  throw new ERR_OUT_OF_RANGE(type || "offset", `>= ${type ? 1 : 0} and <= ${length}`, value);
}
var INVALID_BASE64_RE = /[^+/0-9A-Za-z-_]/g;
function base64clean(str) {
  if (str = str.split("=")[0], str = str.trim().replace(INVALID_BASE64_RE, ""), str.length < 2)
    return "";
  while (str.length % 4 !== 0)
    str = str + "=";
  return str;
}
function utf8ToBytes(string, units) {
  units = units || 1 / 0;
  let codePoint, length = string.length, leadSurrogate = null, bytes = [];
  for (let i2 = 0;i2 < length; ++i2) {
    if (codePoint = string.charCodeAt(i2), codePoint > 55295 && codePoint < 57344) {
      if (!leadSurrogate) {
        if (codePoint > 56319) {
          if ((units -= 3) > -1)
            bytes.push(239, 191, 189);
          continue;
        } else if (i2 + 1 === length) {
          if ((units -= 3) > -1)
            bytes.push(239, 191, 189);
          continue;
        }
        leadSurrogate = codePoint;
        continue;
      }
      if (codePoint < 56320) {
        if ((units -= 3) > -1)
          bytes.push(239, 191, 189);
        leadSurrogate = codePoint;
        continue;
      }
      codePoint = (leadSurrogate - 55296 << 10 | codePoint - 56320) + 65536;
    } else if (leadSurrogate) {
      if ((units -= 3) > -1)
        bytes.push(239, 191, 189);
    }
    if (leadSurrogate = null, codePoint < 128) {
      if ((units -= 1) < 0)
        break;
      bytes.push(codePoint);
    } else if (codePoint < 2048) {
      if ((units -= 2) < 0)
        break;
      bytes.push(codePoint >> 6 | 192, codePoint & 63 | 128);
    } else if (codePoint < 65536) {
      if ((units -= 3) < 0)
        break;
      bytes.push(codePoint >> 12 | 224, codePoint >> 6 & 63 | 128, codePoint & 63 | 128);
    } else if (codePoint < 1114112) {
      if ((units -= 4) < 0)
        break;
      bytes.push(codePoint >> 18 | 240, codePoint >> 12 & 63 | 128, codePoint >> 6 & 63 | 128, codePoint & 63 | 128);
    } else
      throw Error("Invalid code point");
  }
  return bytes;
}
function asciiToBytes(str) {
  let byteArray = [];
  for (let i2 = 0;i2 < str.length; ++i2)
    byteArray.push(str.charCodeAt(i2) & 255);
  return byteArray;
}
function utf16leToBytes(str, units) {
  let c, hi, lo, byteArray = [];
  for (let i2 = 0;i2 < str.length; ++i2) {
    if ((units -= 2) < 0)
      break;
    c = str.charCodeAt(i2), hi = c >> 8, lo = c % 256, byteArray.push(lo), byteArray.push(hi);
  }
  return byteArray;
}
function base64ToBytes(str) {
  return toByteArray(base64clean(str));
}
function blitBuffer(src, dst, offset, length) {
  let i2;
  for (i2 = 0;i2 < length; ++i2) {
    if (i2 + offset >= dst.length || i2 >= src.length)
      break;
    dst[i2 + offset] = src[i2];
  }
  return i2;
}
function isInstance(obj, type) {
  return obj instanceof type || obj != null && obj.constructor != null && obj.constructor.name != null && obj.constructor.name === type.name;
}
var hexSliceLookupTable = function() {
  let table = Array(256);
  for (let i2 = 0;i2 < 16; ++i2) {
    let i16 = i2 * 16;
    for (let j = 0;j < 16; ++j)
      table[i16 + j] = "0123456789abcdef"[i2] + "0123456789abcdef"[j];
  }
  return table;
}();
function defineBigIntMethod(fn) {
  return typeof BigInt > "u" ? BufferBigIntNotDefined : fn;
}
function BufferBigIntNotDefined() {
  throw Error("BigInt not supported");
}
function notimpl(name) {
  return () => {
    throw Error(name + " is not implemented for node:buffer browser polyfill");
  };
}
var resolveObjectURL = notimpl("resolveObjectURL");
var isUtf8 = notimpl("isUtf8");
var transcode = notimpl("transcode");

// language/browser/shims/globals.ts
var scope = globalThis;
if (!scope.Buffer)
  scope.Buffer = Buffer2;
if (!scope.process) {
  scope.process = {
    env: { NODE_ENV: "production" },
    cwd: () => "/",
    platform: "browser",
    argv: [],
    exitCode: undefined,
    versions: {},
    stdout: { write: () => true, isTTY: false },
    stderr: { write: () => true, isTTY: false },
    on: () => {
      return;
    },
    exit: (code) => {
      throw new Error(`process.exit(${code ?? 0}) called in the browser build`);
    }
  };
}

// language/browser/shims/fs-promises.ts
init_fs();
var { readFile: readFile2, writeFile: writeFile2, mkdir: mkdir2, readdir: readdir2, stat: stat2, access: access2, copyFile: copyFile2, cp: cp2, rm: rm2, chmod: chmod2, mkdtemp: mkdtemp2 } = promises;

// packages/generator/src/pipeline/generate-application.ts
init_path();

// packages/core/src/logging/logger.ts
var import_pino = __toESM(require_browser(), 1);
// packages/core/src/logging/log-spec.json
var log_spec_default = {
  specVersion: "1.0.0",
  description: "The log specification — the single source of truth for what this repository logs, at what level, on which channel, and with which fields. A call site names an event id; the level, the channel, the message and the required fields come from here, so changing what is logged is a change to this file rather than a sweep through the code. Every channel here is the modelling tool's own. The generated application logs through Loco's `tracing` subscriber and does not read this file: it is a Rust crate, and a JSON catalogue it would have to parse at startup to say the same things `tracing` already says is a translation layer, not a shared contract.",
  levels: {
    fatal: 60,
    error: 50,
    warn: 40,
    info: 30,
    debug: 20,
    trace: 10
  },
  environments: {
    production: {
      level: "info",
      pretty: false
    },
    staging: {
      level: "info",
      pretty: false
    },
    development: {
      level: "debug",
      pretty: true
    },
    test: {
      level: "silent",
      pretty: false
    }
  },
  transport: {
    destination: "stdout",
    rationale: "The application writes structured JSON to stdout and nothing else — no files, no rotation, no network. Whatever runs the process (Docker, Kubernetes, systemd, a log shipper) is what collects and ships it. A process that manages its own log files has to be configured twice, fills a disk nobody is watching, and blocks the event loop doing it.",
    asyncOnProduction: true
  },
  redact: {
    censor: "[redacted]",
    paths: [
      "password",
      "passwordHash",
      "password_hash",
      "currentPassword",
      "newPassword",
      "token",
      "accessToken",
      "refreshToken",
      "sessionToken",
      "apiKey",
      "api_key",
      "secret",
      "clientSecret",
      "privateKey",
      "authorization",
      "cookie",
      "setCookie",
      "req.headers.authorization",
      "req.headers.cookie",
      "res.headers['set-cookie']",
      "body.password",
      "body.token",
      "*.password",
      "*.token",
      "*.secret"
    ],
    rationale: "Redaction is declared once, here, rather than remembered at each call site. A credential reaches stdout exactly once before it is in a log aggregator forever, so the default is to censor by key name anywhere in the object rather than to trust every caller to strip it."
  },
  channels: [
    {
      name: "db",
      description: "Database connection lifecycle and schema migrations. Individual successful queries are not events; a failure is.",
      level: "info",
      surfaces: [
        "generator"
      ]
    },
    {
      name: "pipeline",
      description: "The code-generation pipeline: check the model, compile its directives, emit the application.",
      level: "info",
      surfaces: [
        "generator"
      ]
    },
    {
      name: "auth",
      description: "Authentication outcomes for the modelling tool: sign-in, registration, refusal, rate limiting.",
      level: "info",
      surfaces: [
        "generator"
      ]
    },
    {
      name: "ai",
      description: "Calls to the local model. A prompt and a completion are business data and are never logged.",
      level: "debug",
      surfaces: [
        "generator"
      ]
    },
    {
      name: "app",
      description: "Process lifecycle: an unhandled error reaching the top of the process, and shutdown on a signal.",
      level: "info",
      surfaces: [
        "generator"
      ]
    },
    {
      name: "entity",
      description: "Business reads and writes in a generated application: promotion, the audit trail, and a value the row decoder could not read.",
      level: "debug",
      surfaces: [
        "generated"
      ]
    },
    {
      name: "rules",
      description: "Business-rule evaluation and the actions a matched rule performed.",
      level: "warn",
      surfaces: [
        "generated"
      ]
    },
    {
      name: "workflow",
      description: "Saga and state-machine execution, step by step.",
      level: "debug",
      surfaces: [
        "generated"
      ]
    },
    {
      name: "jobs",
      description: "Background workers: what was queued, and what could not be delivered.",
      level: "info",
      surfaces: [
        "generated"
      ]
    },
    {
      name: "dictionary",
      description: "The Application Dictionary at run time: cache invalidation, and a column it describes that the database does not have.",
      level: "debug",
      surfaces: [
        "generated"
      ]
    },
    {
      name: "request",
      description: "One line per HTTP request the generated application answered, and the errors that reached the top of a handler.",
      level: "info",
      surfaces: [
        "generated"
      ]
    },
    {
      name: "assistant",
      description: "The generated application's natural-language query add-on.",
      level: "warn",
      surfaces: [
        "generated"
      ]
    }
  ],
  events: [
    {
      id: "db.pool.opened",
      channel: "db",
      level: "info",
      message: "Database connection pool opened",
      fields: [
        "host",
        "database",
        "max"
      ]
    },
    {
      id: "db.pool.closed",
      channel: "db",
      level: "info",
      message: "Database connection pool closed",
      fields: []
    },
    {
      id: "db.migrations.completed",
      channel: "db",
      level: "info",
      message: "Schema migrations applied",
      fields: [
        "durationMs"
      ]
    },
    {
      id: "db.migrations.failed",
      channel: "db",
      level: "error",
      message: "Schema migrations did not complete",
      fields: [
        "reason"
      ]
    },
    {
      id: "pipeline.generation.started",
      channel: "pipeline",
      level: "info",
      message: "Generation started",
      fields: [
        "project",
        "stack",
        "entities"
      ]
    },
    {
      id: "pipeline.generation.completed",
      channel: "pipeline",
      level: "info",
      message: "Generation completed",
      fields: [
        "project",
        "files",
        "durationMs"
      ]
    },
    {
      id: "pipeline.generation.failed",
      channel: "pipeline",
      level: "error",
      message: "Generation did not complete",
      fields: [
        "project",
        "reason"
      ]
    },
    {
      id: "pipeline.model.rejected",
      channel: "pipeline",
      level: "warn",
      message: "The model did not pass the checker, so nothing was generated",
      fields: [
        "project",
        "errors"
      ]
    },
    {
      id: "auth.signin.succeeded",
      channel: "auth",
      level: "info",
      message: "Sign-in succeeded",
      fields: [
        "userId"
      ]
    },
    {
      id: "auth.signin.refused",
      channel: "auth",
      level: "warn",
      message: "Sign-in refused",
      fields: [
        "reason"
      ]
    },
    {
      id: "auth.registration.accepted",
      channel: "auth",
      level: "info",
      message: "Registration accepted and awaiting approval",
      fields: [
        "userId"
      ]
    },
    {
      id: "auth.request.failed",
      channel: "auth",
      level: "error",
      message: "An authentication request failed before it could be answered",
      fields: [
        "route",
        "reason"
      ]
    },
    {
      id: "ai.model.requested",
      channel: "ai",
      level: "debug",
      message: "Model call issued",
      fields: [
        "model",
        "operation"
      ]
    },
    {
      id: "ai.model.failed",
      channel: "ai",
      level: "error",
      message: "Model call failed",
      fields: [
        "model",
        "operation",
        "reason"
      ]
    },
    {
      id: "app.shutdown",
      channel: "app",
      level: "info",
      message: "Application shutting down",
      fields: [
        "signal",
        "uptimeMs"
      ]
    },
    {
      id: "app.uncaught",
      channel: "app",
      level: "fatal",
      message: "Unhandled error reached the top of the process",
      fields: [
        "err"
      ]
    },
    {
      id: "entity.audit.unavailable",
      channel: "entity",
      level: "error",
      message: "The audit service is not initialised, so this write was not recorded",
      fields: []
    },
    {
      id: "entity.promotion.unavailable",
      channel: "entity",
      level: "error",
      message: "The promotion service is not initialised, so the row keeps its draft status",
      fields: []
    },
    {
      id: "entity.promotion.failed",
      channel: "entity",
      level: "error",
      message: "Promotion failed; the row was left as a draft",
      fields: [
        "table",
        "error"
      ]
    },
    {
      id: "entity.draft.discard_failed",
      channel: "entity",
      level: "error",
      message: "A rejected draft could not be discarded and is still in the table",
      fields: [
        "id",
        "error"
      ]
    },
    {
      id: "entity.update.restore_failed",
      channel: "entity",
      level: "error",
      message: "A refused update could not be rolled back and the record still holds the refused values",
      fields: [
        "id",
        "error"
      ]
    },
    {
      id: "entity.column.undecodable",
      channel: "entity",
      level: "warn",
      message: "A column's value could not be decoded and was served as null",
      fields: [
        "column",
        "error"
      ]
    },
    {
      id: "entity.delete.no_match",
      channel: "entity",
      level: "debug",
      message: "A delete step matched no row",
      fields: [
        "entity",
        "id"
      ]
    },
    {
      id: "rules.jdm.invalid",
      channel: "rules",
      level: "error",
      message: "A stored decision graph is not valid JDM and was skipped",
      fields: [
        "entity",
        "error"
      ]
    },
    {
      id: "rules.evaluation.failed",
      channel: "rules",
      level: "error",
      message: "Rule evaluation failed; the write was allowed to stand",
      fields: [
        "entity",
        "error"
      ]
    },
    {
      id: "rules.action.failed",
      channel: "rules",
      level: "error",
      message: "A rule action failed; the write stands",
      fields: [
        "action",
        "error"
      ]
    },
    {
      id: "rules.action.unknown",
      channel: "rules",
      level: "warn",
      message: "A matched rule named an action this runtime does not implement",
      fields: [
        "action"
      ]
    },
    {
      id: "rules.target.unknown",
      channel: "rules",
      level: "warn",
      message: "A rule action named a table or column the dictionary does not describe",
      fields: [
        "table",
        "column"
      ]
    },
    {
      id: "rules.workflow.incomplete",
      channel: "rules",
      level: "warn",
      message: "A rule-triggered workflow did not complete; the run is recorded as failed",
      fields: [
        "workflow",
        "error"
      ]
    },
    {
      id: "workflow.node.executing",
      channel: "workflow",
      level: "debug",
      message: "Executing a workflow node",
      fields: [
        "node",
        "name"
      ]
    },
    {
      id: "workflow.node.unknown",
      channel: "workflow",
      level: "warn",
      message: "A workflow node names a type this runtime does not implement; skipped",
      fields: [
        "node"
      ]
    },
    {
      id: "workflow.decision.published",
      channel: "workflow",
      level: "debug",
      message: "A decision step published variables to the run context",
      fields: [
        "published"
      ]
    },
    {
      id: "jobs.queued",
      channel: "jobs",
      level: "info",
      message: "A background job was accepted",
      fields: [
        "worker",
        "entity"
      ]
    },
    {
      id: "jobs.mailer.absent",
      channel: "jobs",
      level: "warn",
      message: "No mailer is configured, so the message was not sent",
      fields: [
        "to"
      ]
    },
    {
      id: "dictionary.cache.invalidated",
      channel: "dictionary",
      level: "debug",
      message: "Cached metadata was dropped after a dictionary write",
      fields: [
        "table",
        "cache"
      ]
    },
    {
      id: "dictionary.column.absent",
      channel: "dictionary",
      level: "warn",
      message: "The dictionary names an ordering column the table does not have; ordered by primary key instead",
      fields: [
        "table",
        "column"
      ]
    },
    {
      id: "dictionary.config.unreadable",
      channel: "dictionary",
      level: "warn",
      message: "sys_system could not be read; configuration resolved from the settings block alone",
      fields: [
        "error"
      ]
    },
    {
      id: "request.completed",
      channel: "request",
      level: "info",
      message: "Request completed",
      fields: [
        "method",
        "path",
        "status",
        "durationMs",
        "requestId"
      ]
    },
    {
      id: "request.refused",
      channel: "request",
      level: "warn",
      message: "Request refused",
      fields: [
        "method",
        "path",
        "status",
        "durationMs",
        "requestId"
      ]
    },
    {
      id: "request.failed",
      channel: "request",
      level: "error",
      message: "Request failed",
      fields: [
        "method",
        "path",
        "status",
        "durationMs",
        "requestId"
      ]
    },
    {
      id: "request.unhandled",
      channel: "request",
      level: "error",
      message: "An error reached the top of a request handler",
      fields: [
        "error"
      ]
    },
    {
      id: "assistant.plan.unparseable",
      channel: "assistant",
      level: "warn",
      message: "The model returned a query plan that could not be parsed",
      fields: [
        "error"
      ]
    },
    {
      id: "entity.audit.write_failed",
      channel: "entity",
      level: "error",
      message: "An audit entry could not be written; the operation it records was NOT rolled back",
      fields: [
        "entity",
        "error"
      ]
    },
    {
      id: "jobs.upstream.unreachable",
      channel: "jobs",
      level: "error",
      message: "An upstream service this application proxies to could not be reached",
      fields: [
        "upstream",
        "error"
      ]
    }
  ]
};

// packages/core/src/logging/spec.ts
var LEVELS = ["fatal", "error", "warn", "info", "debug", "trace"];
function isLevel(value) {
  return typeof value === "string" && LEVELS.includes(value);
}
function isConfiguredLevel(value) {
  return value === "silent" || isLevel(value);
}
function validate(spec) {
  const problems = [];
  const channelNames = new Set(spec.channels.map((channel) => channel.name));
  if (channelNames.size !== spec.channels.length) {
    problems.push("two channels share a name");
  }
  for (const channel of spec.channels) {
    if (!isLevel(channel.level)) {
      problems.push(`channel ${channel.name} has level ${String(channel.level)}, which is not a level`);
    }
  }
  const eventIds = new Set;
  for (const event of spec.events) {
    if (eventIds.has(event.id))
      problems.push(`two events share the id ${event.id}`);
    eventIds.add(event.id);
    if (!channelNames.has(event.channel)) {
      problems.push(`event ${event.id} is on channel ${event.channel}, which is not declared`);
    }
    if (!isLevel(event.level)) {
      problems.push(`event ${event.id} has level ${String(event.level)}, which is not a level`);
    }
    if (!event.message) {
      problems.push(`event ${event.id} has no message`);
    }
  }
  for (const [name, profile] of Object.entries(spec.environments)) {
    if (!isConfiguredLevel(profile.level)) {
      problems.push(`environment ${name} has level ${String(profile.level)}, which is not a level`);
    }
  }
  if (problems.length > 0) {
    throw new Error(`log-spec.json is not internally consistent:
  - ${problems.join(`
  - `)}`);
  }
  return spec;
}
var logSpec = validate(log_spec_default);
var EVENTS_BY_ID = new Map(logSpec.events.map((event) => [event.id, event]));
var CHANNELS_BY_NAME = new Map(logSpec.channels.map((channel) => [channel.name, channel]));
function findEvent(id) {
  return EVENTS_BY_ID.get(id);
}
function profileFor(env) {
  const named = env ? logSpec.environments[env] : undefined;
  if (named)
    return named;
  const production = logSpec.environments.production;
  if (!production)
    throw new Error("log-spec.json declares no production environment");
  return production;
}
function resolveLevel(channelName, env = process.env) {
  const perChannel = env[`LOG_LEVEL_${channelName.toUpperCase()}`];
  if (isConfiguredLevel(perChannel))
    return perChannel;
  const global = env.LOG_LEVEL;
  if (isConfiguredLevel(global))
    return global;
  const channel = CHANNELS_BY_NAME.get(channelName);
  const profile = profileFor(env.NODE_ENV);
  if (profile.level === "silent")
    return "silent";
  if (!channel)
    return profile.level;
  const rank = (level) => level === "silent" ? Number.POSITIVE_INFINITY : logSpec.levels[level];
  return rank(channel.level) < rank(profile.level) ? profile.level : channel.level;
}

// packages/core/src/logging/logger.ts
function buildRedaction() {
  return { paths: [...logSpec.redact.paths], censor: logSpec.redact.censor };
}
var root;
var rootEnvKey;
function envKey(env) {
  return [env.NODE_ENV ?? "", env.LOG_LEVEL ?? "", env.LOG_PRETTY ?? "", env.LOG_NAME ?? ""].join("\x00");
}
function createRoot(options) {
  const env = options.env ?? process.env;
  const profile = profileFor(env.NODE_ENV);
  const rootLevel = "trace";
  const pretty = env.LOG_PRETTY === "true" ? true : env.LOG_PRETTY === "false" ? false : profile.pretty;
  const base = { service: env.LOG_NAME ?? "appwithai" };
  const shared = {
    level: rootLevel,
    base,
    redact: buildRedaction(),
    timestamp: import_pino.pino.stdTimeFunctions.isoTime,
    formatters: {
      level(label) {
        return { level: label };
      }
    }
  };
  if (options.destination) {
    return import_pino.pino(shared, options.destination);
  }
  if (pretty) {
    return import_pino.pino({
      ...shared,
      transport: {
        target: "pino-pretty",
        options: { colorize: true, translateTime: "HH:MM:ss.l", ignore: "pid,hostname" }
      }
    });
  }
  const sync = env.NODE_ENV === "test" || env.LOG_SYNC === "true";
  return import_pino.pino(shared, import_pino.destination({ dest: 1, sync }));
}
function getRoot(options) {
  const env = options.env ?? process.env;
  const key = envKey(env);
  if (!root || rootEnvKey !== key || options.destination) {
    root = createRoot(options);
    rootEnvKey = key;
  }
  return root;
}
function wrap(pinoLogger, channel, level) {
  const emit = (levelName, fields, message) => {
    pinoLogger[levelName](fields, message);
  };
  return {
    channel,
    level,
    event(id, fields = {}) {
      const declared = findEvent(id);
      if (!declared) {
        pinoLogger.warn({ ...fields, event: id, logSpecViolation: "unknown-event-id" }, `Log event "${id}" is not declared in log-spec.json`);
        return;
      }
      const missing = declared.fields.filter((field) => !(field in fields));
      const payload = { ...fields, event: declared.id };
      if (missing.length > 0)
        payload.logSpecMissingFields = missing;
      emit(declared.level, payload, declared.message);
    },
    fatal: (fields, message) => emit("fatal", fields, message),
    error: (fields, message) => emit("error", fields, message),
    warn: (fields, message) => emit("warn", fields, message),
    info: (fields, message) => emit("info", fields, message),
    debug: (fields, message) => emit("debug", fields, message),
    trace: (fields, message) => emit("trace", fields, message),
    child: (bindings) => wrap(pinoLogger.child(bindings), channel, level)
  };
}
var channelCache = new Map;
function getLogger(channel, options = {}) {
  const bespoke = options.env !== undefined || options.destination !== undefined;
  if (!bespoke) {
    const cached = channelCache.get(channel);
    if (cached)
      return cached;
  }
  const env = options.env ?? process.env;
  const level = resolveLevel(channel, env);
  const pinoLogger = getRoot(options).child({ channel }, { level });
  const logger = wrap(pinoLogger, channel, level);
  if (!bespoke)
    channelCache.set(channel, logger);
  return logger;
}
// packages/generator/src/generators/full-stack.generator.ts
init_path();

// packages/generator/src/generators/tanstack-astryx-loco/astryx-frontend.generator.ts
init_path();

// packages/generator/src/generators/base.generator.ts
init_loader();

class BaseGenerator {
  templateLoader;
  constructor(templateDir) {
    this.templateLoader = new TemplateLoader(templateDir);
  }
  async renderTemplate(templatePath, context) {
    const template = await this.templateLoader.load(templatePath);
    return template(context);
  }
}

// packages/generator/src/generators/tanstack-astryx-loco/tanstack-start-frontend.generator.ts
init_types2();
init_utils();
init_path();
var __dirname = "/home/user/cedm-specification/app-with-ai-rust/packages/generator/src/generators/tanstack-astryx-loco";
function resolveTemplateDir(subpath) {
  const configured = "/packages/generator/templates";
  if (configured)
    return join(configured, subpath);
  const cwd = process.cwd();
  const possiblePaths = [
    join(cwd, "packages/generator/templates", subpath),
    join(cwd, "../../../packages/generator/templates", subpath),
    join(cwd, "../../packages/generator/templates", subpath),
    join(__dirname, "../../../templates", subpath)
  ];
  for (const possiblePath of possiblePaths) {
    try {
      const stat = (init_fs(), __toCommonJS(exports_fs)).statSync(possiblePath);
      if (stat.isDirectory()) {
        return possiblePath;
      }
    } catch {}
  }
  const fallbackPath = join(__dirname, "../../../templates", subpath);
  console.error(`Template directory not found. Tried paths:`);
  for (const p of possiblePaths) {
    console.error(`  - ${p}`);
  }
  console.error(`Using fallback: ${fallbackPath}`);
  return fallbackPath;
}

class TanStackStartFrontendGenerator extends BaseGenerator {
  options;
  resolvedTemplateDir;
  constructor(options) {
    const templateDir = resolveTemplateDir("tanstack-astryx-loco/frontend");
    super(templateDir);
    this.options = options;
    this.resolvedTemplateDir = templateDir;
  }
  async generate(entities, relationships, outputDir) {
    console.log(`
\uD83D\uDCE6 Phase 1: Preparing frontend directory (templates are the source)`);
    await mkdir2(outputDir, { recursive: true });
    console.log(`
\uD83C\uDFA8 Phase 2: Overlaying custom templates...`);
    const context = this.prepareContext(entities, relationships);
    await this.createAdditionalDirectories(outputDir);
    await this.copyPublicAssets(outputDir);
    await this.generateCoreFiles(outputDir, context);
    await this.generateApiLayer(outputDir, context);
    await this.generateComponents(outputDir, context);
    await this.generateEntityPages(outputDir, context);
    await this.generateAdminPages(outputDir, context);
    await this.updateConfigFiles(outputDir, context);
    await this.generateTestFiles(outputDir, context);
    console.log(`
✅ TanStack Start frontend generation complete!`);
  }
  async createAdditionalDirectories(outputDir) {
    const dirs = [
      "src/routes",
      "src/routes/admin",
      "src/routes/auth",
      "src/components/ui",
      "src/components/admin",
      "src/components/forms",
      "src/components/tables",
      "src/components/layout",
      "src/components/skeletons",
      "src/components/reports",
      "src/components/automation",
      "src/components/ai",
      "src/lib/automation",
      "src/lib/workflow",
      "src/contexts",
      "src/hooks",
      "src/i18n",
      "src/lib",
      "src/messages",
      "src/providers",
      "src/styles",
      "src/types",
      "src/lib/queries",
      "test"
    ];
    for (const dir of dirs) {
      await mkdir2(join(outputDir, dir), { recursive: true });
    }
  }
  prepareContext(entities, relationships) {
    const declared = declaredEntityNames(entities);
    const busEntities = entities.map((entity) => entityToBusEntity(entity, declared));
    const mainEntities = busEntities.filter((e) => !e.tableName.includes("_") || e.tableName.match(/^bus_[a-z]+$/)).slice(0, 10).map((entity) => ({
      ...entity,
      title: entity.displayName || entity.name,
      description: `Manage ${entity.displayName || entity.name}`,
      icon: this.getIconForEntity(entity.tableName)
    }));
    return {
      testsWorkspace: this.options.testsWorkspace ?? false,
      project: {
        name: this.options.projectName,
        version: this.options.projectVersion,
        description: this.options.projectDescription,
        id: this.options.projectName.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        snake: this.options.projectName.toLowerCase().replace(/[^a-z0-9]+/g, "_")
      },
      config: {
        baseUrl: this.options.apiBaseUrl,
        backendPort: (() => {
          try {
            return new URL(this.options.apiBaseUrl || "http://localhost:3001").port || "3001";
          } catch {
            return "3001";
          }
        })(),
        frontendPort: this.options.frontendPort ?? 3001,
        enableDarkMode: this.options.enableDarkMode
      },
      projectName: this.options.projectName,
      projectSnake: this.options.projectName.toLowerCase().replace(/[^a-z0-9]+/g, "_"),
      projectKebab: this.options.projectName.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      entities: busEntities,
      mainEntities,
      relationships,
      now: new Date().toISOString()
    };
  }
  getIconForEntity(tableName) {
    const iconMap = {
      bus_patient: "UserCircle",
      bus_patient_insurance: "FileCheck",
      bus_patient_document: "FileText",
      bus_patient_allergy: "Activity",
      bus_insurance_provider: "Building2",
      bus_insurance_claim: "FileCheck",
      bus_appointment: "Calendar",
      bus_admission: "ClipboardList",
      bus_prescription: "Pill",
      bus_medication: "Pill",
      bus_lab_order: "TestTube",
      bus_lab_result: "FileCheck",
      bus_radiology_order: "Activity",
      bus_radiology_report: "FileText",
      bus_department: "Building2",
      bus_staff: "Users",
      bus_customer: "Building2",
      bus_product: "Package",
      bus_order: "ShoppingCart",
      bus_sales_order: "Receipt"
    };
    return iconMap[tableName] || "FileText";
  }
  async generateCoreFiles(outputDir, context) {
    const templateDir = this.resolvedTemplateDir;
    const routerContent = await this.renderTemplate("src/router.tsx.hbs", context);
    await writeFile2(join(outputDir, "src/router.tsx"), routerContent);
    const layoutContent = await this.renderTemplate("src/routes/__root.tsx.hbs", context);
    await writeFile2(join(outputDir, "src/routes/__root.tsx"), layoutContent);
    const homePageContent = await this.renderTemplate("src/routes/index.tsx.hbs", context);
    await writeFile2(join(outputDir, "src/routes/index.tsx"), homePageContent);
    const dashboardPageContent = await this.renderTemplate("src/routes/dashboard.tsx.hbs", context);
    await writeFile2(join(outputDir, "src/routes/dashboard.tsx"), dashboardPageContent);
    const askPageContent = await this.renderTemplate("src/routes/ask.tsx.hbs", context);
    await writeFile2(join(outputDir, "src/routes/ask.tsx"), askPageContent);
    const nlQueryPanelContent = await this.renderTemplate("src/components/ai/nl-query-panel.tsx.hbs", context);
    await writeFile2(join(outputDir, "src/components/ai/nl-query-panel.tsx"), nlQueryPanelContent);
    try {
      const adminLayoutContent = await this.renderTemplate("src/routes/admin.tsx.hbs", context);
      await writeFile2(join(outputDir, "src/routes/admin.tsx"), adminLayoutContent);
    } catch (e) {
      console.warn("Admin layout route template not found");
    }
    const providersContent = await this.renderTemplate("src/providers/index.tsx.hbs", context);
    await writeFile2(join(outputDir, "src/providers/index.tsx"), providersContent);
    try {
      await copyFile2(join(this.resolvedTemplateDir, "src/providers/electric-provider.tsx"), join(outputDir, "src/providers/electric-provider.tsx"));
    } catch (e) {
      console.warn("electric-provider static file not found, skipping:", e.message);
    }
    const providerFiles = ["src/providers/query-provider.tsx"];
    for (const file of providerFiles) {
      try {
        await copyFile2(join(templateDir, file), join(outputDir, file));
      } catch (e) {
        console.warn(`Provider file not found: ${file}`);
      }
    }
    await mkdir2(join(outputDir, "src/contexts"), { recursive: true });
    try {
      await copyFile2(join(templateDir, "src/contexts/auth-context.tsx"), join(outputDir, "src/contexts/auth-context.tsx"));
    } catch (e) {
      console.warn("Auth context file not found");
    }
    const stylesContent = await this.renderTemplate("src/styles/globals.css.hbs", context);
    await writeFile2(join(outputDir, "src/styles/globals.css"), stylesContent);
    try {
      const loginPageContent = await this.renderTemplate("src/routes/auth/login.tsx.hbs", context);
      await writeFile2(join(outputDir, "src/routes/auth/login.tsx"), loginPageContent);
    } catch (e) {
      console.warn("Login page template not found");
    }
    try {
      const signupPageContent = await this.renderTemplate("src/routes/auth/signup.tsx.hbs", context);
      await writeFile2(join(outputDir, "src/routes/auth/signup.tsx"), signupPageContent);
    } catch (e) {
      console.warn("Signup page template not found");
    }
    try {
      await copyFile2(join(templateDir, "src/lib/auth.ts"), join(outputDir, "src/lib/auth.ts"));
    } catch (e) {
      console.warn("Auth lib file not found");
    }
    try {
      await mkdir2(join(outputDir, "src/routes/api/auth"), { recursive: true });
      const authProxyContent = await this.renderTemplate("src/routes/api/auth/$.ts.hbs", context);
      await writeFile2(join(outputDir, "src/routes/api/auth/$.ts"), authProxyContent);
    } catch (e) {
      console.warn("Auth proxy route template not found");
    }
  }
  async generateApiLayer(outputDir, context) {
    const templateDir = this.resolvedTemplateDir;
    const apiClientContent = await this.renderTemplate("src/lib/api-client.ts.hbs", context);
    await writeFile2(join(outputDir, "src/lib/api-client.ts"), apiClientContent);
    try {
      const fieldSchemaContent = await this.renderTemplate("src/lib/field-schema.ts.hbs", context);
      await writeFile2(join(outputDir, "src/lib/field-schema.ts"), fieldSchemaContent);
    } catch (e) {
      console.warn("field-schema template not found, skipping:", e.message);
    }
    try {
      const electricContent = await this.renderTemplate("src/lib/electric.ts.hbs", context);
      await writeFile2(join(outputDir, "src/lib/electric.ts"), electricContent);
    } catch (e) {
      console.warn("Electric template not found, skipping:", e.message);
    }
    try {
      const collectionsContent = await this.renderTemplate("src/lib/sys-collections.ts.hbs", context);
      await writeFile2(join(outputDir, "src/lib/sys-collections.ts"), collectionsContent);
    } catch (e) {
      console.warn("sys-collections template not found, skipping:", e.message);
    }
    const i18nFiles = [
      "src/lib/translations.tsx",
      "src/lib/i18n-fields.ts",
      "src/i18n/config.ts",
      "src/messages/en.json",
      "src/messages/de.json"
    ];
    for (const file of i18nFiles) {
      try {
        await copyFile2(join(templateDir, file), join(outputDir, file));
      } catch (e) {
        console.warn(`i18n file not found: ${file}`);
      }
    }
    const hooksContent = await this.renderTemplate("src/hooks/use-entities.ts.hbs", context);
    await writeFile2(join(outputDir, "src/hooks/use-entities.ts"), hooksContent);
    const fieldHooksContent = await this.renderTemplate("src/hooks/use-field-metadata.ts.hbs", context);
    await writeFile2(join(outputDir, "src/hooks/use-field-metadata.ts"), fieldHooksContent);
    try {
      const sysElectricContent = await this.renderTemplate("src/hooks/use-sys-electric.ts.hbs", context);
      await writeFile2(join(outputDir, "src/hooks/use-sys-electric.ts"), sysElectricContent);
    } catch (e) {
      console.warn("use-sys-electric template not found, skipping:", e.message);
    }
  }
  async generateComponents(outputDir, _context) {
    const templateDir = this.resolvedTemplateDir;
    const staticLibFiles = [
      "src/lib/utils.ts",
      "src/lib/csv.ts",
      "src/lib/concurrency.ts",
      "src/lib/embed.ts"
    ];
    for (const file of staticLibFiles) {
      try {
        await copyFile2(join(templateDir, file), join(outputDir, file));
      } catch (e) {
        console.warn(`Static lib file not found: ${file}`, e.message);
      }
    }
    await mkdir2(join(outputDir, "src/components/layout"), { recursive: true });
    const staticLayoutComponents = [
      "src/components/layout/app-shell.tsx",
      "src/components/layout/header.tsx",
      "src/components/layout/index.ts"
    ];
    for (const component of staticLayoutComponents) {
      await copyFile2(join(templateDir, component), join(outputDir, component));
    }
    const sidebarContent = await this.renderTemplate("src/components/layout/sidebar.tsx.hbs", _context);
    await writeFile2(join(outputDir, "src/components/layout/sidebar.tsx"), sidebarContent);
    const staticComponents = [
      {
        src: "src/components/forms/dynamic-form.tsx",
        dest: "src/components/forms/dynamic-form.tsx"
      },
      {
        src: "src/components/tables/dynamic-table.tsx",
        dest: "src/components/tables/dynamic-table.tsx"
      },
      {
        src: "src/components/admin/field-layout-editor.tsx",
        dest: "src/components/admin/field-layout-editor.tsx"
      },
      {
        src: "src/components/admin/field-group-manager.tsx",
        dest: "src/components/admin/field-group-manager.tsx"
      },
      {
        src: "src/components/admin/ad-toolbar.tsx",
        dest: "src/components/admin/ad-toolbar.tsx"
      },
      {
        src: "src/components/admin/ad-breadcrumb.tsx",
        dest: "src/components/admin/ad-breadcrumb.tsx"
      },
      {
        src: "src/components/admin/ad-record-nav.tsx",
        dest: "src/components/admin/ad-record-nav.tsx"
      },
      {
        src: "src/components/admin/ad-sidebar.tsx",
        dest: "src/components/admin/ad-sidebar.tsx"
      },
      {
        src: "src/components/admin/ad-field-definitions.ts",
        dest: "src/components/admin/ad-field-definitions.ts"
      },
      {
        src: "src/components/admin/ad-window-configs.ts",
        dest: "src/components/admin/ad-window-configs.ts"
      },
      {
        src: "src/hooks/use-dictionary-lists.ts",
        dest: "src/hooks/use-dictionary-lists.ts"
      },
      {
        src: "src/hooks/use-dashboard.ts",
        dest: "src/hooks/use-dashboard.ts"
      },
      {
        src: "src/hooks/use-record-navigation.ts",
        dest: "src/hooks/use-record-navigation.ts"
      },
      {
        src: "src/hooks/use-window-tabs.ts",
        dest: "src/hooks/use-window-tabs.ts"
      },
      {
        src: "src/hooks/use-bus-entity-level.ts",
        dest: "src/hooks/use-bus-entity-level.ts"
      },
      {
        src: "src/components/skeletons/form-skeleton.tsx",
        dest: "src/components/skeletons/form-skeleton.tsx"
      },
      {
        src: "src/hooks/use-bus-entity-level.ts",
        dest: "src/hooks/use-bus-entity-level.ts"
      },
      {
        src: "src/components/admin/window-help-dialog.tsx",
        dest: "src/components/admin/window-help-dialog.tsx"
      },
      {
        src: "src/components/admin/ad-detail-shell.tsx",
        dest: "src/components/admin/ad-detail-shell.tsx"
      },
      {
        src: "src/components/admin/ad-list-shell.tsx",
        dest: "src/components/admin/ad-list-shell.tsx"
      },
      {
        src: "src/components/admin/conflict-dialog.tsx",
        dest: "src/components/admin/conflict-dialog.tsx"
      },
      {
        src: "src/components/admin/unified-field-layout.tsx",
        dest: "src/components/admin/unified-field-layout.tsx"
      },
      {
        src: "src/components/admin/bus-entity-page.tsx",
        dest: "src/components/admin/bus-entity-page.tsx"
      },
      {
        src: "src/components/admin/bus-entity-detail-page.tsx",
        dest: "src/components/admin/bus-entity-detail-page.tsx"
      },
      {
        src: "src/components/admin/bpmn-canvas.tsx",
        dest: "src/components/admin/bpmn-canvas.tsx"
      },
      {
        src: "src/components/admin/automation-chain.tsx",
        dest: "src/components/admin/automation-chain.tsx"
      },
      {
        src: "src/components/admin/smart-value-picker.tsx",
        dest: "src/components/admin/smart-value-picker.tsx"
      },
      {
        src: "src/components/admin/use-dictionary-entities.ts",
        dest: "src/components/admin/use-dictionary-entities.ts"
      },
      {
        src: "src/components/admin/decision-table-editor.tsx",
        dest: "src/components/admin/decision-table-editor.tsx"
      },
      {
        src: "src/components/admin/doc-status-badge.tsx",
        dest: "src/components/admin/doc-status-badge.tsx"
      },
      {
        src: "src/components/admin/workflow-state-bar.tsx",
        dest: "src/components/admin/workflow-state-bar.tsx"
      },
      {
        src: "src/components/admin/account-dialogs.tsx",
        dest: "src/components/admin/account-dialogs.tsx"
      },
      {
        src: "src/lib/accounts.ts",
        dest: "src/lib/accounts.ts"
      },
      {
        src: "src/components/admin/use-report-designs.ts",
        dest: "src/components/admin/use-report-designs.ts"
      },
      {
        src: "src/components/reports/report-designer.tsx",
        dest: "src/components/reports/report-designer.tsx"
      },
      {
        src: "src/components/reports/report-print-modal.tsx",
        dest: "src/components/reports/report-print-modal.tsx"
      },
      {
        src: "src/components/reports/report-chart.tsx",
        dest: "src/components/reports/report-chart.tsx"
      },
      {
        src: "src/hooks/use-reports.ts",
        dest: "src/hooks/use-reports.ts"
      },
      {
        src: "src/routes/reports.index.tsx",
        dest: "src/routes/reports.index.tsx"
      },
      {
        src: "src/routes/reports.$name.tsx",
        dest: "src/routes/reports.$name.tsx"
      },
      {
        src: "src/lib/workflow/step-types.ts",
        dest: "src/lib/workflow/step-types.ts"
      },
      {
        src: "src/lib/workflow/bpmn-model.ts",
        dest: "src/lib/workflow/bpmn-model.ts"
      },
      {
        src: "src/lib/automation/model.ts",
        dest: "src/lib/automation/model.ts"
      },
      {
        src: "src/lib/automation/rule-content.ts",
        dest: "src/lib/automation/rule-content.ts"
      },
      {
        src: "src/lib/automation/yaml.ts",
        dest: "src/lib/automation/yaml.ts"
      },
      {
        src: "src/components/automation/AutomationBuilder.tsx",
        dest: "src/components/automation/AutomationBuilder.tsx"
      },
      {
        src: "src/components/automation/AutomationHelp.tsx",
        dest: "src/components/automation/AutomationHelp.tsx"
      },
      {
        src: "src/components/automation/LadderCard.tsx",
        dest: "src/components/automation/LadderCard.tsx"
      },
      {
        src: "src/components/automation/RailList.tsx",
        dest: "src/components/automation/RailList.tsx"
      },
      {
        src: "src/components/automation/RuleTableEditor.tsx",
        dest: "src/components/automation/RuleTableEditor.tsx"
      },
      {
        src: "src/components/automation/StepInspector.tsx",
        dest: "src/components/automation/StepInspector.tsx"
      },
      {
        src: "src/providers/browser-router-provider.tsx",
        dest: "src/providers/browser-router-provider.tsx"
      },
      {
        src: "src/lib/queries/use-auth.ts",
        dest: "src/lib/queries/use-auth.ts"
      },
      {
        src: "src/components/skeletons/dashboard-skeleton.tsx",
        dest: "src/components/skeletons/dashboard-skeleton.tsx"
      },
      {
        src: "src/components/skeletons/table-rows-skeleton.tsx",
        dest: "src/components/skeletons/table-rows-skeleton.tsx"
      },
      {
        src: "src/components/skeletons/stats-card-skeleton.tsx",
        dest: "src/components/skeletons/stats-card-skeleton.tsx"
      }
    ];
    for (const component of staticComponents) {
      try {
        await copyFile2(join(templateDir, component.src), join(outputDir, component.dest));
      } catch (e) {
        console.warn(`Static component not found: ${component.src}`);
      }
    }
    const dynamicRoutes = ["$entity.tsx", "$entity.$id.tsx"];
    for (const routeFile of dynamicRoutes) {
      try {
        await copyFile2(join(templateDir, "src/routes", routeFile), join(outputDir, "src/routes", routeFile));
      } catch (e) {
        console.warn(`Dynamic route not found: ${routeFile}`);
      }
    }
  }
  async generateSingleEntityRoutes(busEntity, context, outputDir) {
    const displayName = busEntity.displayName || busEntity.name.charAt(0).toUpperCase() + busEntity.name.slice(1).toLowerCase().replace(/_([a-z])/g, (_, c) => " " + c.toUpperCase());
    const entityContext = { ...context, entity: { ...busEntity, displayName } };
    await mkdir2(join(outputDir, "src/routes"), { recursive: true });
    const listPageFilename = `${kebabCase(busEntity.name)}.tsx`;
    const listPageContent = await this.renderTemplate("src/routes/$entity/index.tsx.hbs", entityContext);
    await writeFile2(join(outputDir, "src/routes", listPageFilename), listPageContent);
    const detailPageFilename = `${kebabCase(busEntity.name)}.$id.tsx`;
    const detailPageContent = await this.renderTemplate("src/routes/$entity/$id.tsx.hbs", entityContext);
    await writeFile2(join(outputDir, "src/routes", detailPageFilename), detailPageContent);
  }
  async generateSingleEntity(entity, relationships, outputDir, allEntities) {
    const context = this.prepareContext(allEntities, relationships);
    const busEntities = context.entities;
    const busEntity = busEntities.find((e) => e.originalName === entity.name || e.name === entity.name) ?? busEntities[0];
    await this.generateSingleEntityRoutes(busEntity, context, outputDir);
    const listFile = `${kebabCase(entity.name)}.tsx`;
    const detailFile = `${kebabCase(entity.name)}.$id.tsx`;
    console.log(`  ✓ frontend/src/routes/${listFile}`);
    console.log(`  ✓ frontend/src/routes/${detailFile}`);
  }
  async generateEntityPages(outputDir, context) {
    for (const busEntity of context.entities) {
      await this.generateSingleEntityRoutes(busEntity, context, outputDir);
    }
  }
  async generateAdminPages(outputDir, context) {
    const adminDir = join(outputDir, "src/routes/admin");
    await mkdir2(adminDir, { recursive: true });
    const templateDir = this.resolvedTemplateDir;
    const staticAdminPages = [
      "index.tsx",
      "tables.tsx",
      "windows.tsx",
      "references.tsx",
      "elements.tsx",
      "system.tsx",
      "reports.tsx"
    ];
    for (const page of staticAdminPages) {
      try {
        await copyFile2(join(templateDir, "src/routes/admin", page), join(adminDir, page));
      } catch (e) {
        console.warn(`Static admin page not found: ${page}`);
      }
    }
    const fieldsContent = await this.renderTemplate("src/routes/admin/fields.tsx.hbs", context);
    await writeFile2(join(adminDir, "fields.tsx"), fieldsContent);
    try {
      const rulesContent = await this.renderTemplate("src/routes/admin/rules.tsx.hbs", context);
      await writeFile2(join(adminDir, "rules.tsx"), rulesContent);
    } catch (e) {
      console.warn("Admin rules page template not found");
    }
    try {
      const categoriesContent = await this.renderTemplate("src/routes/admin/categories.tsx.hbs", context);
      await writeFile2(join(adminDir, "categories.tsx"), categoriesContent);
    } catch (e) {
      console.warn("Admin categories page template not found");
    }
    try {
      const automationsContent = await this.renderTemplate("src/routes/admin/automations.tsx.hbs", context);
      await writeFile2(join(adminDir, "automations.tsx"), automationsContent);
    } catch (e) {
      console.warn("Admin automations page template not found");
    }
    try {
      const workflowsContent = await this.renderTemplate("src/routes/admin/workflows.tsx.hbs", context);
      await writeFile2(join(adminDir, "workflows.tsx"), workflowsContent);
    } catch (e) {
      console.warn("Admin workflows page template not found");
    }
    try {
      await copyFile2(join(templateDir, "src/routes/admin/audit.tsx"), join(adminDir, "audit.tsx"));
    } catch (e) {
      console.warn("Admin audit page not found");
    }
    try {
      const usersContent = await this.renderTemplate("src/routes/admin/users.tsx.hbs", context);
      await writeFile2(join(adminDir, "users.tsx"), usersContent);
    } catch (e) {
      console.warn("Admin users page template not found");
    }
    try {
      const rolesContent = await this.renderTemplate("src/routes/admin/roles.tsx.hbs", context);
      await writeFile2(join(adminDir, "roles.tsx"), rolesContent);
    } catch (e) {
      console.warn("Admin roles page template not found");
    }
    const adminSubdirs = [
      { src: "src/routes/admin/table", dest: "src/routes/admin/table" },
      { src: "src/routes/admin/window", dest: "src/routes/admin/window" },
      { src: "src/routes/admin/element", dest: "src/routes/admin/element" },
      { src: "src/routes/admin/reference", dest: "src/routes/admin/reference" },
      { src: "src/routes/admin/rules", dest: "src/routes/admin/rules" },
      { src: "src/routes/admin/reports", dest: "src/routes/admin/reports" },
      {
        src: "src/routes/admin/workflow-definitions",
        dest: "src/routes/admin/workflow-definitions"
      }
    ];
    for (const subdir of adminSubdirs) {
      try {
        await this.copyDirRecursive(join(templateDir, subdir.src), join(outputDir, subdir.dest));
      } catch (e) {
        console.warn(`Admin subdir not found: ${subdir.src}`);
      }
    }
  }
  async copyPublicAssets(outputDir) {
    try {
      await this.copyDirRecursive(join(this.resolvedTemplateDir, "public"), join(outputDir, "public"));
    } catch (e) {
      console.warn("Public assets not found, skipping:", e.message);
    }
  }
  async copyDirRecursive(src, dest) {
    await mkdir2(dest, { recursive: true });
    const entries = await readdir2(src, { withFileTypes: true });
    for (const entry of entries) {
      const srcPath = join(src, entry.name);
      const destPath = join(dest, entry.name);
      if (entry.isDirectory()) {
        await this.copyDirRecursive(srcPath, destPath);
      } else {
        await copyFile2(srcPath, destPath);
      }
    }
  }
  async updateConfigFiles(outputDir, context) {
    const packageJsonContent = await this.renderTemplate("package.json.hbs", context);
    await writeFile2(join(outputDir, "package.json"), typeof packageJsonContent === "string" ? packageJsonContent : JSON.stringify(packageJsonContent, null, 2));
    try {
      const viteConfigContent = await this.renderTemplate("vite.config.ts.hbs", context);
      await writeFile2(join(outputDir, "vite.config.ts"), viteConfigContent);
    } catch (e) {
      console.warn("Custom vite.config.ts template not found, keeping the scaffold default");
    }
    try {
      const tsconfigContent = await this.renderTemplate("tsconfig.json.hbs", context);
      await writeFile2(join(outputDir, "tsconfig.json"), tsconfigContent);
    } catch (e) {
      console.warn("Custom tsconfig template not found, keeping TanStack Start default");
    }
    try {
      const biomeContent = await this.renderTemplate("biome.json.hbs", context);
      await writeFile2(join(outputDir, "biome.json"), biomeContent);
    } catch (e) {
      console.warn("Custom Biome config template not found, using defaults");
    }
    const envLocalContent = `VITE_API_URL=
VITE_BACKEND_URL=${context.config.baseUrl}
VITE_MASTRA_URL=http://localhost:4111
# Set VITE_ELECTRIC_URL to enable ElectricSQL real-time sync (requires ELECTRIC_URL on backend)
# Leave empty to use HTTP API fallback
VITE_ELECTRIC_URL=
PORT=3001
`;
    await writeFile2(join(outputDir, ".env.local"), envLocalContent);
    try {
      const dockerfileContent = await this.renderTemplate("Dockerfile.hbs", context);
      await writeFile2(join(outputDir, "Dockerfile"), dockerfileContent);
    } catch (e) {
      console.warn("Frontend Dockerfile template not found, skipping");
    }
  }
  async generateTestFiles(outputDir, context) {
    try {
      const setupContent = await this.renderTemplate("test/setup.tsx.hbs", context);
      await writeFile2(join(outputDir, "test/setup.tsx"), setupContent);
      const componentsTestContent = await this.renderTemplate("test/components.test.tsx.hbs", context);
      await writeFile2(join(outputDir, "test/components.test.tsx"), componentsTestContent);
      const automationYamlTest = await this.renderTemplate("test/automation-yaml.test.ts.hbs", context);
      await writeFile2(join(outputDir, "test/automation-yaml.test.ts"), automationYamlTest);
      const vitestContent = await this.renderTemplate("vitest.config.ts.hbs", context);
      await writeFile2(join(outputDir, "vitest.config.ts"), vitestContent);
    } catch (e) {
      console.warn("Unit test templates not found, skipping unit test generation");
    }
  }
}

// packages/generator/src/generators/tanstack-astryx-loco/astryx-frontend.generator.ts
var __dirname = "/home/user/cedm-specification/app-with-ai-rust/packages/generator/src/generators/tanstack-astryx-loco";
function resolveTemplateDir2(subpath) {
  const configured = "/packages/generator/templates";
  if (configured)
    return join(configured, subpath);
  const cwd = process.cwd();
  const possiblePaths = [
    join(cwd, "packages/generator/templates", subpath),
    join(cwd, "templates", subpath),
    join(cwd, "../../../packages/generator/templates", subpath),
    join(cwd, "../../packages/generator/templates", subpath),
    join(__dirname, "../../../templates", subpath)
  ];
  for (const possiblePath of possiblePaths) {
    try {
      if ((init_fs(), __toCommonJS(exports_fs)).statSync(possiblePath).isDirectory())
        return possiblePath;
    } catch {}
  }
  return join(__dirname, "../../../templates", subpath);
}
var ASTRYX_THEMES = [
  "neutral",
  "butter",
  "chocolate",
  "matcha",
  "stone",
  "gothic",
  "y2k"
];
var ASTRYX_VERSION = "0.2.0";

class AstryxFrontendGenerator extends BaseGenerator {
  options;
  constructor(options) {
    super(resolveTemplateDir2("tanstack-astryx-loco/frontend"));
    this.options = options;
  }
  async generate(entities, relationships, outputDir) {
    console.log(`
\uD83D\uDCE6 Phase 1: Generating TanStack Start frontend...`);
    const base = new TanStackStartFrontendGenerator({
      ...this.options,
      stackOption: "tanstack-astryx-loco"
    });
    await base.generate(entities, relationships, outputDir);
    console.log(`
\uD83C\uDFA8 Phase 2: Applying the Astryx overlay...`);
    const context = this.prepareContext();
    await this.rewriteDependencies(outputDir);
    await this.writeRendered("src/styles/globals.css.hbs", "src/styles/globals.css", outputDir, context);
    await this.writeRendered("src/providers/astryx-provider.tsx.hbs", "src/providers/astryx-provider.tsx", outputDir, context);
    await this.writeRendered("src/components/theme-selector.tsx.hbs", "src/components/theme-selector.tsx", outputDir, context);
    await this.writeUiAdapters(outputDir, context);
    await this.mountAstryxProvider(outputDir);
    console.log(`
✅ Astryx frontend generation complete!`);
  }
  async writeUiAdapters(outputDir, context) {
    const adapters = [
      "alert-dialog",
      "avatar",
      "badge",
      "breadcrumb",
      "button",
      "card",
      "checkbox",
      "dialog",
      "dropdown-menu",
      "empty-state",
      "icon",
      "input",
      "label",
      "layout",
      "mobile-sidebar",
      "scroll-area",
      "select",
      "separator",
      "skeleton",
      "slider",
      "switch",
      "table",
      "tabs",
      "textarea",
      "toast",
      "tooltip"
    ];
    for (const name of adapters) {
      await this.writeRendered(`src/components/ui/${name}.tsx.hbs`, `src/components/ui/${name}.tsx`, outputDir, context);
    }
    const readme = join(resolveTemplateDir2("tanstack-astryx-loco/frontend"), "src/components/ui/README.md");
    try {
      await copyFile2(readme, join(outputDir, "src/components/ui/README.md"));
    } catch {}
    console.log(`  ✓ components/ui: ${adapters.length} Astryx adapters`);
  }
  prepareContext() {
    const theme = this.options.astryxTheme ?? "neutral";
    return {
      project: {
        name: this.options.projectName,
        version: this.options.projectVersion,
        description: this.options.projectDescription
      },
      astryxThemeName: theme,
      astryxTheme: theme,
      projectKebab: this.options.projectName.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      now: new Date().toISOString()
    };
  }
  async writeRendered(tpl, out, outputDir, context) {
    const content = await this.renderTemplate(tpl, context);
    const target = join(outputDir, out);
    await mkdir2(dirname(target), { recursive: true });
    await writeFile2(target, content);
  }
  async rewriteDependencies(outputDir) {
    const pkgPath = join(outputDir, "package.json");
    let pkg;
    try {
      pkg = JSON.parse(await readFile2(pkgPath, "utf-8"));
    } catch (error) {
      console.warn(`  ⚠️  Could not read generated package.json, skipping dependency rewrite: ${error.message}`);
      return;
    }
    pkg.dependencies = {
      ...pkg.dependencies,
      react: "^19.0.0",
      "react-dom": "^19.0.0",
      "@astryxdesign/core": ASTRYX_VERSION,
      ...Object.fromEntries(ASTRYX_THEMES.map((name) => [`@astryxdesign/theme-${name}`, ASTRYX_VERSION])),
      "@stylexjs/stylex": "^0.19.0"
    };
    pkg.devDependencies = {
      ...pkg.devDependencies,
      "@astryxdesign/cli": ASTRYX_VERSION,
      "@types/react": "^19.0.0",
      "@types/react-dom": "^19.0.0"
    };
    const removed = [];
    for (const name of Object.keys(pkg.dependencies)) {
      if (name.startsWith("@radix-ui/") || name === "class-variance-authority") {
        delete pkg.dependencies[name];
        removed.push(name);
      }
    }
    await writeFile2(pkgPath, `${JSON.stringify(pkg, null, 2)}
`);
    console.log(`  ✓ package.json: React 19 + Astryx, ${removed.length} unused Radix/CVA deps removed`);
  }
  async mountAstryxProvider(outputDir) {
    const providersPath = join(outputDir, "src/providers/index.tsx");
    let source;
    try {
      source = await readFile2(providersPath, "utf-8");
    } catch {
      console.warn("  ⚠️  src/providers/index.tsx not found — mount AstryxProvider manually");
      return;
    }
    if (source.includes("AstryxProvider"))
      return;
    const openTag = "    <QueryProvider>";
    const closeTag = "    </QueryProvider>";
    if (!source.includes(openTag) || !source.includes(closeTag)) {
      console.warn("  ⚠️  Could not find the QueryProvider anchor in src/providers/index.tsx — " + "wrap the provider tree in <AstryxProvider> manually");
      return;
    }
    const withImport = source.replace("import { QueryProvider } from './query-provider';", `import { QueryProvider } from './query-provider';
import { AstryxProvider } from './astryx-provider';`);
    const lines = withImport.split(`
`);
    const openIndex = lines.findIndex((line) => line === openTag);
    const closeIndex = lines.findIndex((line, i) => i > openIndex && line === closeTag);
    if (openIndex === -1 || closeIndex === -1) {
      console.warn("  ⚠️  Provider tree shape not recognised — mount <AstryxProvider> manually");
      return;
    }
    const inner = lines.slice(openIndex, closeIndex + 1).map((line) => line.trim() === "" ? line : `  ${line}`);
    const wrapped = [
      ...lines.slice(0, openIndex),
      "    <AstryxProvider>",
      ...inner,
      "    </AstryxProvider>",
      ...lines.slice(closeIndex + 1)
    ].join(`
`);
    await writeFile2(providersPath, wrapped);
    console.log("  ✓ Mounted AstryxProvider in the provider tree");
  }
}
// packages/generator/src/generators/tanstack-astryx-loco/loco-backend.generator.ts
init_types2();

// language/browser/shims/os.ts
var tmpdir = () => "/tmp";

// packages/generator/src/generators/tanstack-astryx-loco/loco-backend.generator.ts
init_path();

// packages/generator/src/hooks/index.ts
var HOOK_TYPES = [
  "beforeCreate",
  "afterCreate",
  "beforeUpdate",
  "afterUpdate",
  "beforeDelete",
  "afterDelete",
  "beforeRead",
  "afterRead",
  "beforeQuery",
  "afterQuery",
  "beforeList",
  "afterList",
  "customValidate"
];
var HOOK_TYPE_SET = new Set(HOOK_TYPES);
function compileHookDeclarations(declarations, knownEntities = [], onWarn = () => {}) {
  const known = new Set(knownEntities);
  const hooks = [];
  const seen = new Set;
  const perEntity = new Map;
  for (const declaration of declarations) {
    const { event: type, handler, entity } = declaration;
    if (!HOOK_TYPE_SET.has(type)) {
      onWarn(`Hook "${handler}" on ${entity} uses unknown event "${type}" — skipped.`);
      continue;
    }
    if (known.size && !known.has(entity)) {
      onWarn(`Hook "${handler}" targets unknown entity "${entity}" — skipped.`);
      continue;
    }
    const key = `${entity}:${type}:${handler}`;
    if (seen.has(key)) {
      onWarn(`Hook "${handler}" is declared twice for ${entity}.${type} — keeping the first.`);
      continue;
    }
    seen.add(key);
    const order = perEntity.get(entity) ?? 0;
    perEntity.set(entity, order + 1);
    hooks.push({
      entity,
      type,
      handler,
      field: declaration.fields?.[0],
      order
    });
  }
  const byName = new Map;
  const kept = [];
  for (const hook of hooks) {
    const nameKey = `${hook.entity}:${hook.handler}`;
    const clash = byName.get(nameKey);
    if (clash) {
      onWarn(`Hook "${hook.handler}" on ${hook.entity} is bound to both ${clash.type} and ` + `${hook.type} — keeping ${clash.type}. Give each event its own handler name.`);
      continue;
    }
    byName.set(nameKey, hook);
    kept.push(hook);
  }
  return kept;
}
function hooksByEntity(hooks) {
  const grouped = new Map;
  for (const hook of hooks) {
    const list = grouped.get(hook.entity);
    if (list)
      list.push(hook);
    else
      grouped.set(hook.entity, [hook]);
  }
  for (const list of grouped.values())
    list.sort((a, b) => a.order - b.order);
  return grouped;
}

// packages/generator/src/logging/generated-spec.ts
function macroArm(eventId) {
  return eventId.replace(/[.-]/g, "_");
}
function generatedChannels() {
  return logSpec.channels.filter((channel) => channel.surfaces.includes("generated")).map((channel) => channel.name);
}
function generatedEvents() {
  const channels = new Set(generatedChannels());
  return logSpec.events.filter((event) => channels.has(event.channel));
}
function tracingMacro(level) {
  return level === "fatal" ? "error" : level;
}
function rustString(value) {
  return `"${value.replace(/\\/g, "\\\\").replace(/"/g, "\\\"")}"`;
}
function buildGeneratedLoggingModule(projectName) {
  const events = generatedEvents();
  const out = [];
  out.push("//! The event catalogue this application logs against.");
  out.push("//!");
  out.push(`//! Derived from the log specification for ${projectName}. Regenerate rather`);
  out.push("//! than edit: this file is generated from");
  out.push("//! `packages/core/src/logging/log-spec.json`, which is where an event's");
  out.push("//! level and message are decided, and a change made here is lost on the next");
  out.push("//! run and disagrees with the catalogue in the meantime.");
  out.push("//!");
  out.push("//! A call site names what happened rather than a level and a sentence:");
  out.push("//!");
  out.push("//! ```ignore");
  out.push("//! log_event!(rules_action_unknown, action = other);");
  out.push("//! ```");
  out.push("//!");
  out.push("//! Every line carries an `event` field, so a query can ask for one kind of");
  out.push("//! event without matching on wording that is free to change. The transport is");
  out.push("//! Loco's own subscriber — this adds a vocabulary, not a second logger.");
  out.push("");
  out.push("/// Emit a catalogued event through `tracing`.");
  out.push("///");
  out.push("/// The macro is exported at the crate root, so call sites write");
  out.push("/// `crate::log_event!(...)` from anywhere in the crate.");
  out.push("#[macro_export]");
  out.push("macro_rules! log_event {");
  for (const event of events) {
    const arm = macroArm(event.id);
    const level = tracingMacro(event.level);
    const id = rustString(event.id);
    const message = rustString(event.message);
    out.push(`    // ${event.channel} — ${event.level}`);
    out.push(`    (${arm}) => {`);
    out.push(`        ::tracing::${level}!(event = ${id}, ${message})`);
    out.push("    };");
    out.push(`    (${arm}, $($field:tt)+) => {`);
    out.push(`        ::tracing::${level}!(event = ${id}, $($field)+, ${message})`);
    out.push("    };");
  }
  out.push("}");
  out.push("");
  out.push("/// Every event id this catalogue defines, for the suite that checks it.");
  out.push("///");
  out.push("/// A list rather than a doc comment: a test can read it, and a catalogue");
  out.push("/// nothing can enumerate is one nothing can hold to the spec.");
  out.push(`pub const EVENT_IDS: [&str; ${events.length}] = [`);
  for (const event of events) {
    out.push(`    ${rustString(event.id)},`);
  }
  out.push("];");
  out.push("");
  return out.join(`
`);
}

// packages/generator/src/rbac/roles.ts
function titleCaseRole(name) {
  return name.split(/[\s_-]+/).filter(Boolean).map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
}
function localPart(name) {
  return name.toLowerCase().split(/[\s_-]+/).filter(Boolean).join(".");
}
var ADMIN_ROLE = "Administrator";
var BUILT_IN = [
  {
    name: ADMIN_ROLE,
    declaredAs: "administrator",
    description: "Full access to every entity, and bypasses every restriction",
    isAdmin: true,
    userLevel: "S"
  },
  {
    name: "User",
    declaredAs: "user",
    description: "Signed in, holding no functional role",
    isAdmin: false,
    userLevel: "U"
  }
];
function deriveAccess(compiled, options) {
  const declared = new Map;
  const remember = (role) => {
    const key = role.toLowerCase();
    if (!declared.has(key))
      declared.set(key, role);
  };
  for (const rule of compiled.operations)
    for (const role of rule.roles)
      remember(role);
  for (const rule of compiled.transitions)
    for (const role of rule.roles)
      remember(role);
  const roles = BUILT_IN.map((role) => ({ ...role }));
  const taken = new Set(roles.map((role) => role.name.toLowerCase()));
  for (const key of [...declared.keys()].sort()) {
    const spelling = declared.get(key);
    const name = titleCaseRole(spelling);
    if (taken.has(name.toLowerCase()))
      continue;
    taken.add(name.toLowerCase());
    roles.push({
      name,
      declaredAs: spelling,
      description: `Declared by the model's access rules as ${spelling}`,
      isAdmin: false,
      userLevel: "U"
    });
  }
  const adminEmail = options.adminEmail?.trim() || "admin@admin.com";
  const domain = `${options.projectId || "app"}.example.com`;
  const users = roles.map((role) => role.isAdmin ? {
    email: adminEmail,
    name: options.adminName?.trim() || "Administrator",
    roleName: role.name,
    description: "Bypasses every restriction — the account to compare the others against",
    isAdmin: true
  } : {
    email: `${localPart(role.declaredAs)}@${domain}`,
    name: role.name,
    roleName: role.name,
    description: `Holds ${role.name} and nothing else`,
    isAdmin: false
  });
  const entityVisibility = {};
  for (const rule of compiled.operations) {
    if (rule.operation !== "read")
      continue;
    const existing = entityVisibility[rule.entity] ?? [];
    entityVisibility[rule.entity] = [...new Set([...existing, ...rule.roles])].sort();
  }
  const allEntities = options.entities && options.entities.length > 0 ? options.entities : Object.keys(entityVisibility);
  const normalize = (value) => value.trim().toLowerCase().replace(/[\s-]+/g, "_");
  const entityCounts = {};
  for (const role of roles) {
    entityCounts[role.name] = role.isAdmin ? allEntities.length : allEntities.filter((entity) => {
      const allowed = entityVisibility[entity];
      if (!allowed || allowed.length === 0)
        return true;
      return allowed.some((name) => normalize(name) === normalize(role.declaredAs));
    }).length;
  }
  return {
    roles,
    users,
    entityVisibility,
    entityCounts,
    scoped: Object.keys(entityVisibility).length > 0
  };
}

// packages/generator/src/utils/cli-executor.ts
init_child_process();
class CliExecutor {
  static executeSync(command, args, options = {}) {
    const cwd = options.cwd || process.cwd();
    const env = { ...process.env, ...options.env };
    const fullCommand = `${command} ${args.join(" ")}`;
    try {
      console.log(`  \uD83D\uDD27 Running: ${fullCommand}`);
      const output = execSync(fullCommand, {
        cwd,
        env,
        stdio: options.stdio || "pipe",
        timeout: options.timeout || 300000,
        encoding: "utf-8"
      });
      return output;
    } catch (error) {
      const err = error;
      console.error(`  ❌ Command failed: ${fullCommand}`);
      console.error(`  Error: ${err.message}`);
      throw new Error(`Failed to execute: ${fullCommand}`);
    }
  }
  static async executeAsync(command, args, options = {}) {
    return new Promise((resolve, reject) => {
      const cwd = options.cwd || process.cwd();
      const env = { ...process.env, ...options.env };
      console.log(`  \uD83D\uDD27 Running: ${command} ${args.join(" ")}`);
      const child = spawn(command, args, {
        cwd,
        env,
        stdio: options.closeStdin ? ["ignore", options.stdio === "inherit" ? "inherit" : "pipe", options.stdio === "inherit" ? "inherit" : "pipe"] : options.stdio === "inherit" ? "inherit" : ["pipe", "pipe", "pipe"]
      });
      let stdout = "";
      let stderr = "";
      if (options.stdio !== "inherit") {
        child.stdout?.on("data", (data) => {
          stdout += data.toString();
        });
        child.stderr?.on("data", (data) => {
          stderr += data.toString();
        });
      }
      const timeout = options.timeout || 300000;
      const timer = setTimeout(() => {
        child.kill();
        reject(new Error(`Command timeout after ${timeout}ms: ${command} ${args.join(" ")}`));
      }, timeout);
      child.on("close", (code) => {
        clearTimeout(timer);
        if (code === 0) {
          resolve(stdout);
        } else {
          console.error(`  ❌ Command failed with code ${code}: ${command} ${args.join(" ")}`);
          if (stderr)
            console.error(`  Error output:
${stderr}`);
          reject(new Error(`Command failed with code ${code}: ${command}`));
        }
      });
      child.on("error", (error) => {
        clearTimeout(timer);
        console.error(`  ❌ Failed to start process: ${command}`);
        reject(error);
      });
    });
  }
  static isCommandAvailable(command) {
    try {
      execSync(`which ${command}`, { stdio: "pipe" });
      return true;
    } catch {
      return false;
    }
  }
  static getCommandVersion(command, versionFlag = "--version") {
    try {
      const output = execSync(`${command} ${versionFlag}`, {
        stdio: "pipe",
        encoding: "utf-8",
        timeout: 5000
      });
      return output.trim();
    } catch {
      return null;
    }
  }
  static async isDirectoryEmpty(dirPath) {
    try {
      const entries = await readdir2(dirPath);
      return entries.length === 0;
    } catch {
      return true;
    }
  }
  static async removeDirectory(dirPath) {
    try {
      await rm2(dirPath, { recursive: true, force: true });
    } catch (error) {
      console.warn(`Warning: Could not remove directory ${dirPath}`);
    }
  }
  static async copyDirectory(src, dest) {
    try {
      await cp2(src, dest, { recursive: true });
    } catch (error) {
      throw new Error(`Failed to copy directory from ${src} to ${dest}`);
    }
  }
}

// packages/generator/src/model/language-maps.ts
init_fs();
init_path();

// language/browser/shims/url.ts
function fileURLToPath(url) {
  const parsed = typeof url === "string" ? new URL(url) : url;
  if (parsed.protocol !== "file:")
    throw new TypeError(`The URL must be of scheme file: ${parsed.href}`);
  return decodeURIComponent(parsed.pathname);
}

// packages/generator/src/model/language-maps.ts
class LanguageDefinitionError extends Error {
  constructor(message) {
    super(message);
    this.name = "LanguageDefinitionError";
  }
}
function candidateFiles() {
  const candidates = [];
  const override = "/language/appwithai-language.json";
  if (override)
    candidates.push(override);
  const starts = [];
  try {
    starts.push(path_default.dirname(fileURLToPath(import.meta.url)));
  } catch {}
  starts.push(process.cwd());
  for (const start of starts) {
    let dir = start;
    for (let depth = 0;depth < 12; depth++) {
      candidates.push(path_default.join(dir, "language", "appwithai-language.json"));
      const parent = path_default.dirname(dir);
      if (parent === dir)
        break;
      dir = parent;
    }
  }
  return candidates;
}
var cachedDefinition;
function loadDefinition() {
  if (cachedDefinition)
    return cachedDefinition;
  const candidates = candidateFiles();
  const file = candidates.find((candidate) => existsSync(candidate));
  if (!file) {
    throw new LanguageDefinitionError("language/appwithai-language.json was not found. Set APPWITHAI_LANGUAGE_FILE to its path. " + `Looked in: ${[...new Set(candidates)].slice(0, 4).join(", ")}, …`);
  }
  try {
    cachedDefinition = JSON.parse(readFileSync(file, "utf-8"));
  } catch (error) {
    throw new LanguageDefinitionError(`${file} is not valid JSON: ${error instanceof Error ? error.message : String(error)}`);
  }
  return cachedDefinition;
}
function getStepNodeTypes() {
  const types = loadDefinition().workflowConstructs?.stepNodes?.types;
  if (!Array.isArray(types)) {
    throw new LanguageDefinitionError("the language definition has no workflowConstructs.stepNodes.types list");
  }
  return types.map((spec) => ({
    name: spec.name,
    purpose: spec.purpose ?? "",
    shipped: spec.shipped !== false,
    required: spec.required ?? [],
    oneOf: spec.oneOf ?? []
  }));
}
function getStepNode(name) {
  return getStepNodeTypes().find((step) => step.name === name);
}
function getTypeMap() {
  const map = loadDefinition().types?.map;
  if (!map || Object.keys(map).length === 0) {
    throw new LanguageDefinitionError("the language definition has no types.map");
  }
  return map;
}
function getDefaultType() {
  const fallback = loadDefinition().types?.default;
  if (!fallback)
    throw new LanguageDefinitionError("the language definition has no types.default");
  return fallback;
}
function getCardinalityKind(from, to) {
  const map = loadDefinition().cardinalities?.map;
  if (!map?.length)
    throw new LanguageDefinitionError("the language definition has no cardinalities.map");
  return map.find((entry) => entry.from === from && entry.to === to)?.kind ?? null;
}

// packages/generator/src/workflows/sagas.ts
function isStepNodeType(value) {
  return getStepNode(value) !== undefined;
}
function missingStepProps(type, props) {
  const spec = getStepNode(type);
  if (!spec)
    return [`unknown step type "${type}"`];
  const has = (key) => (props[key] ?? "").trim().length > 0;
  const missing = spec.required.filter((key) => !has(key));
  for (const group of spec.oneOf ?? []) {
    if (!group.some(has))
      missing.push(group.join(" or "));
  }
  return missing;
}
var OPERATION_ALIASES = {
  create: "CREATE",
  insert: "CREATE",
  add: "CREATE",
  update: "UPDATE",
  edit: "UPDATE",
  write: "UPDATE",
  modify: "UPDATE",
  delete: "DELETE",
  remove: "DELETE",
  destroy: "DELETE",
  all: "ALL",
  any: "ALL",
  "*": "ALL"
};
function sagaOperation(declared) {
  if (declared === undefined || declared.trim() === "")
    return "CREATE";
  return OPERATION_ALIASES[declared.trim().toLowerCase()] ?? declared.trim().toUpperCase();
}
function sagaTrigger(declared) {
  if (declared === undefined || declared.trim() === "")
    return "automatic";
  return declared.trim().toLowerCase();
}
function acceptSagaSteps(workflow, declared, diagnostics) {
  const byNode = new Map;
  for (const step of declared) {
    const { id: nodeId, type: nodeType } = step;
    if (!isStepNodeType(nodeType)) {
      diagnostics.push({ workflow, nodeId, message: `unknown step type "${nodeType}"` });
      continue;
    }
    if (byNode.has(nodeId)) {
      diagnostics.push({
        workflow,
        nodeId,
        message: `step id "${nodeId}" is used twice; the second step is ignored`
      });
      continue;
    }
    for (const missing of missingStepProps(nodeType, step.properties)) {
      diagnostics.push({ workflow, nodeId, message: `${nodeType} is missing ${missing}` });
    }
    byNode.set(nodeId, {
      nodeId,
      nodeType,
      label: step.label ?? nodeId,
      properties: { ...step.properties }
    });
  }
  return byNode;
}
function compileSagaDeclarations(declarations) {
  const workflows = [];
  const diagnostics = [];
  for (const declaration of declarations) {
    const { name, entity } = declaration;
    if (!entity) {
      diagnostics.push({ workflow: name, message: "saga declares no entity" });
    }
    const steps = [...acceptSagaSteps(name, declaration.steps, diagnostics).values()];
    if (steps.length === 0) {
      diagnostics.push({
        workflow: name,
        message: "saga has no steps, so it compiles to an empty process"
      });
    }
    workflows.push({
      name,
      entity,
      operation: sagaOperation(declaration.operation),
      trigger: sagaTrigger(declaration.trigger),
      description: declaration.description,
      steps
    });
  }
  return { workflows, diagnostics };
}

// packages/generator/src/workflows/saga.ts
function escapeXml(value) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}
function safeId(raw) {
  const cleaned = raw.replace(/[^A-Za-z0-9_-]/g, "_");
  return /^[A-Za-z_]/.test(cleaned) ? cleaned : `n_${cleaned}`;
}
var LAYOUT = {
  rowY: 140,
  eventSize: 36,
  taskWidth: 140,
  taskHeight: 80,
  startX: 160,
  gap: 60
};
function buildDiagram(processId, sequence, flowIds) {
  const { rowY, eventSize, taskWidth, taskHeight, startX, gap } = LAYOUT;
  const bounds = sequence.map((id, index) => {
    const isEvent = index === 0 || index === sequence.length - 1;
    const width = isEvent ? eventSize : taskWidth;
    const height = isEvent ? eventSize : taskHeight;
    const x = startX + sequence.slice(0, index).reduce((total, _node, position) => {
      const precedingIsEvent = position === 0 || position === sequence.length - 1;
      return total + (precedingIsEvent ? eventSize : taskWidth) + gap;
    }, 0);
    return { id, x, y: rowY - height / 2, width, height };
  });
  const shapes = bounds.map((node) => `      <bpmndi:BPMNShape id="${node.id}_di" bpmnElement="${node.id}">
        <dc:Bounds x="${node.x}" y="${node.y}" width="${node.width}" height="${node.height}"/>
      </bpmndi:BPMNShape>`).join(`
`);
  const edges = flowIds.map((flowId, index) => {
    const from = bounds[index];
    const to = bounds[index + 1];
    return `      <bpmndi:BPMNEdge id="${flowId}_di" bpmnElement="${flowId}">
        <di:waypoint x="${from.x + from.width}" y="${rowY}"/>
        <di:waypoint x="${to.x}" y="${rowY}"/>
      </bpmndi:BPMNEdge>`;
  }).join(`
`);
  return `  <bpmndi:BPMNDiagram id="BPMNDiagram_${processId}">
    <bpmndi:BPMNPlane id="BPMNPlane_${processId}" bpmnElement="${processId}">
${shapes}
${edges}
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>`;
}
function buildSagaBpmn(saga) {
  const processId = `Process_${safeId(saga.name)}`;
  const startId = `${processId}_start`;
  const endId = `${processId}_end`;
  const taskIds = saga.steps.map((step) => `${processId}_${safeId(step.nodeId)}`);
  const sequence = [startId, ...taskIds, endId];
  const tasks = saga.steps.map((step, index) => {
    const properties = Object.entries(step.properties).map(([key, value]) => `        <appwithai:property name="${escapeXml(key)}" value="${escapeXml(value)}"/>`).join(`
`);
    return `    <bpmn:serviceTask id="${taskIds[index]}" name="${escapeXml(step.label)}">
      <bpmn:extensionElements>
        <appwithai:properties>
        <appwithai:property name="nodeType" value="${escapeXml(step.nodeType)}"/>
${properties}
        </appwithai:properties>
      </bpmn:extensionElements>
    </bpmn:serviceTask>`;
  }).join(`
`);
  const flowIds = sequence.slice(0, -1).map((_from, index) => `${processId}_flow_${index}`);
  const flows = sequence.slice(0, -1).map((from, index) => `    <bpmn:sequenceFlow id="${flowIds[index]}" sourceRef="${from}" targetRef="${sequence[index + 1]}"/>`).join(`
`);
  return `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL"
  xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI"
  xmlns:dc="http://www.omg.org/spec/DD/20100524/DC"
  xmlns:di="http://www.omg.org/spec/DD/20100524/DI"
  xmlns:appwithai="http://appwithai.io/schema/1.0"
  id="Definitions_${safeId(saga.name)}"
  targetNamespace="http://appwithai.io/bpmn">
  <bpmn:process id="${processId}" isExecutable="true">
    <bpmn:startEvent id="${startId}"/>
${tasks}
    <bpmn:endEvent id="${endId}"/>
${flows}
  </bpmn:process>
${buildDiagram(processId, sequence, flowIds)}
</bpmn:definitions>`;
}
function sqlString(value) {
  return `'${value.replace(/'/g, "''")}'`;
}
function buildWorkflowSeedSql(saga, projectName) {
  const header = `-- Model-declared workflows for ${projectName}.
--
-- Generated by @appwithai/generator from the model's \`kind: saga\` sections —
-- do not edit by hand; change the model and regenerate.
--
-- Upserted by name: these definitions belong to the model, and the designer
-- presents them read-only so a regeneration cannot quietly discard an edit
-- someone made in the UI.
`;
  if (saga.length === 0) {
    return `${header}
-- The model declares no sagas.
`;
  }
  const statements = saga.map((workflow) => {
    const bpmn = buildSagaBpmn(workflow);
    const description = workflow.description ? sqlString(workflow.description) : sqlString(`Declared in the model as a ${workflow.trigger}-triggered saga.`);
    return `INSERT INTO sys_workflow_definitions
  (name, entity_name, operation, trigger_type, bpmn_xml, description, is_active, is_model_managed, created_at, updated_at)
VALUES (${sqlString(workflow.name)}, ${sqlString(workflow.entity)}, ${sqlString(workflow.operation)},
        ${sqlString(workflow.trigger)}, ${sqlString(bpmn)}, ${description}, TRUE, TRUE, NOW(), NOW())
ON CONFLICT (name) DO UPDATE SET
  entity_name      = EXCLUDED.entity_name,
  operation        = EXCLUDED.operation,
  trigger_type     = EXCLUDED.trigger_type,
  bpmn_xml         = EXCLUDED.bpmn_xml,
  description      = EXCLUDED.description,
  is_model_managed = TRUE,
  updated_at       = NOW();`;
  });
  return `${header}
${statements.join(`

`)}
`;
}

// language/browser/shims/crypto.ts
function sha1(message) {
  const length = message.length;
  const words = new Uint32Array(((length + 8 >> 6) + 1) * 16);
  for (let i = 0;i < length; i++) {
    words[i >> 2] = (words[i >> 2] ?? 0) | message[i] << 24 - i % 4 * 8;
  }
  words[length >> 2] = (words[length >> 2] ?? 0) | 128 << 24 - length % 4 * 8;
  words[words.length - 1] = length * 8;
  let h0 = 1732584193;
  let h1 = 4023233417;
  let h2 = 2562383102;
  let h3 = 271733878;
  let h4 = 3285377520;
  const w = new Uint32Array(80);
  for (let block = 0;block < words.length; block += 16) {
    for (let t = 0;t < 16; t++)
      w[t] = words[block + t];
    for (let t = 16;t < 80; t++) {
      const x = w[t - 3] ^ w[t - 8] ^ w[t - 14] ^ w[t - 16];
      w[t] = x << 1 | x >>> 31;
    }
    let a = h0;
    let b = h1;
    let c = h2;
    let d = h3;
    let e = h4;
    for (let t = 0;t < 80; t++) {
      const f = t < 20 ? b & c | ~b & d : t < 40 ? b ^ c ^ d : t < 60 ? b & c | b & d | c & d : b ^ c ^ d;
      const k = t < 20 ? 1518500249 : t < 40 ? 1859775393 : t < 60 ? 2400959708 : 3395469782;
      const temp = (a << 5 | a >>> 27) + f + e + k + w[t] >>> 0;
      e = d;
      d = c;
      c = b << 30 | b >>> 2;
      b = a;
      a = temp;
    }
    h0 = h0 + a >>> 0;
    h1 = h1 + b >>> 0;
    h2 = h2 + c >>> 0;
    h3 = h3 + d >>> 0;
    h4 = h4 + e >>> 0;
  }
  const out = new Uint8Array(20);
  [h0, h1, h2, h3, h4].forEach((h, i) => {
    out[i * 4] = h >>> 24;
    out[i * 4 + 1] = h >>> 16 & 255;
    out[i * 4 + 2] = h >>> 8 & 255;
    out[i * 4 + 3] = h & 255;
  });
  return out;
}

class Hash {
  chunks = [];
  update(data) {
    this.chunks.push(typeof data === "string" ? new TextEncoder().encode(data) : data);
    return this;
  }
  digest(encoding) {
    const total = this.chunks.reduce((sum, chunk) => sum + chunk.length, 0);
    const joined = new Uint8Array(total);
    let at = 0;
    for (const chunk of this.chunks) {
      joined.set(chunk, at);
      at += chunk.length;
    }
    const digest = Buffer2.from(sha1(joined));
    return encoding ? digest.toString(encoding) : digest;
  }
}
function createHash(algorithm) {
  if (algorithm.toLowerCase() !== "sha1") {
    throw new Error(`createHash("${algorithm}") is not available in the browser build`);
  }
  return new Hash;
}

// packages/generator/src/generators/tanstack-astryx-loco/dictionary-seed.ts
init_types2();

// packages/generator/src/generators/dictionary-help.ts
init_utils();
var AUDIT_COLUMNS = [
  "created_at",
  "updated_at",
  "deleted_at",
  "created_by",
  "updated_by",
  "version"
];
function join2(items) {
  if (items.length === 0)
    return "";
  if (items.length === 1)
    return items[0];
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}
function article(word) {
  return /^[aeiou]/i.test(word) ? "an" : "a";
}
function isAuditColumn(col) {
  return AUDIT_COLUMNS.includes(col.columnName);
}
function resolveModel(entities) {
  const byStem = new Map(entities.map((e) => [e.stem, e]));
  const resolved = new Map;
  for (const entity of entities) {
    for (const col of entity.columns) {
      if (!col.columnName.endsWith("_id"))
        continue;
      const stem = col.columnName.slice(0, -"_id".length);
      const target = byStem.get(stem);
      if (!target)
        continue;
      if (target.tableName === entity.tableName) {
        col.isBusinessKey = true;
      } else if (col.isForeignKey) {
        col.fkTarget = target.label;
      }
    }
  }
  for (const entity of entities) {
    const children = entities.filter((other) => other.tableName !== entity.tableName && other.columns.some((c) => c.fkTarget === entity.label)).map((other) => other.label);
    resolved.set(entity.tableName, { entity, children });
  }
  return resolved;
}
function windowHelpText(entity, children) {
  const label = entity.label;
  const parents = [
    ...new Set(entity.columns.filter((c) => c.fkTarget).map((c) => c.fkTarget))
  ];
  const uniques = entity.columns.filter((c) => c.isUnique).map((c) => c.displayName);
  const required = entity.columns.filter((c) => c.isMandatory && !isAuditColumn(c)).map((c) => c.displayName);
  const paragraphs = [];
  paragraphs.push(`Create, find and maintain ${label} records. The list shows every ${label} you have access to — ` + `select a row to open it, or use New to add one. Each row is a single ${label}, described by ` + `${entity.columns.length} field${entity.columns.length === 1 ? "" : "s"}.`);
  const identity = [];
  if (uniques.length > 0) {
    identity.push(`${join2(uniques)} ${uniques.length === 1 ? "is unique" : "are unique"}: no two ${label} records ` + `may share the same value, and a save that would duplicate one is rejected.`);
  }
  if (required.length > 0) {
    identity.push(`${join2(required)} must be filled in before the record can be saved.`);
  }
  if (identity.length > 0)
    paragraphs.push(identity.join(" "));
  const links = [];
  if (parents.length > 0) {
    links.push(`Every ${label} points at ${join2(parents)}. Choose the linked record from the lookup on those ` + `fields rather than typing an identifier.`);
  }
  if (children.length > 0) {
    links.push(`${join2(children)} ${children.length === 1 ? "refers" : "refer"} back to ${label}, so what you ` + `change here can affect ${children.length === 1 ? "that record" : "those records"}.`);
  }
  if (links.length > 0)
    paragraphs.push(links.join(" "));
  paragraphs.push(`Every save starts as a Draft. The business rules and workflows attached to ${label} then run together ` + `in a single transaction: if all of them succeed the record becomes Final; if any of them fails, ` + `nothing they changed is kept — the record stays Draft and the reason is written onto it so you can ` + `fix the cause and retry. ${article(label) === "an" ? "An" : "A"} ${label} with no rules or ` + `workflows attached is marked Final immediately.`);
  return paragraphs.join(`

`);
}
function tabHelpText(entity) {
  const label = entity.label;
  const required = entity.columns.filter((c) => c.isMandatory && !isAuditColumn(c));
  const lookups = entity.columns.filter((c) => c.fkTarget);
  const sentences = [];
  sentences.push(`Shows one ${label} at a time. Fields are grouped: General carries the identifying fields and Details ` + `carries the rest.`);
  if (required.length > 0) {
    sentences.push(`${required.length} field${required.length === 1 ? "" : "s"} marked with a red asterisk (*) must have ` + `a value before Save will accept the record.`);
  }
  if (lookups.length > 0) {
    sentences.push(`${join2(lookups.map((c) => c.displayName))} ${lookups.length === 1 ? "is a lookup" : "are lookups"} — ` + `search the linked records instead of entering an identifier by hand.`);
  }
  sentences.push(`Any field showing a ? beside its label has help of its own; click it for the rules that apply there.`);
  return sentences.join(" ");
}
function fieldTypeSentence(entity, col) {
  const noun = col.displayName.toLowerCase();
  switch (col.type) {
    case "date":
      return `The ${noun} of this ${entity.label}, as a calendar date.`;
    case "datetime":
      return `The ${noun} of this ${entity.label}, as a date and time.`;
    case "integer":
      return `The ${noun} of this ${entity.label}, as a whole number.`;
    case "decimal":
      return `The ${noun} of this ${entity.label}, as a decimal amount.`;
    case "boolean":
      return `Whether this ${entity.label} is marked as ${noun}.`;
    case "text":
      return `Free-form ${noun} for this ${entity.label}. The box grows as you type.`;
    case "json":
      return `The ${noun} of this ${entity.label}, held as structured JSON.`;
    default:
      return `The ${noun} of this ${entity.label}.`;
  }
}
function fieldHelpText(entity, col) {
  const parts = [];
  if (col.authorHelp) {
    parts.push(col.authorHelp);
  } else if (col.fkTarget) {
    parts.push(`Links this ${entity.label} to ${article(col.fkTarget)} ${col.fkTarget} record. Pick the ` + `${col.fkTarget} from the lookup — the identifier is stored for you.`);
  } else if (col.isBusinessKey) {
    parts.push(`The ${entity.label} reference used outside this system. It identifies the ${entity.label} on ` + `documents and in exports, and stays with the record for its whole life.`);
  } else if (isAuditColumn(col)) {
    parts.push(`Maintained by the system as part of the audit trail. It is set automatically, not entered here.`);
  } else {
    parts.push(fieldTypeSentence(entity, col));
  }
  if (col.isMandatory && !isAuditColumn(col)) {
    parts.push(`Required — the record cannot be saved while this is empty.`);
  }
  if (col.isUnique) {
    parts.push(`Must be unique: a save is rejected if another ${entity.label} already uses this value.`);
  }
  if (col.maxLength) {
    parts.push(`Up to ${col.maxLength} characters.`);
  }
  return parts.join(" ");
}
function buildDictionaryHelp(entities) {
  const helpEntities = entities.map((entity) => ({
    label: entity.displayName,
    tableName: entity.tableName,
    stem: snakeCase(entity.name),
    columns: entity.attributes.map((attr) => {
      const systemManaged = ["created_at", "updated_at", "deleted_at"].includes(attr.columnName);
      const column = {
        columnName: attr.columnName,
        displayName: attr.displayName,
        type: attr.type,
        isMandatory: systemManaged ? false : attr.required === true,
        isUnique: attr.unique === true,
        isForeignKey: attr.isForeignKey === true
      };
      if (attr.maxLength !== undefined)
        column.maxLength = attr.maxLength;
      const authored = (attr.description ?? "").trim();
      if (authored)
        column.authorHelp = authored;
      return column;
    })
  }));
  const resolved = resolveModel(helpEntities);
  const help = {};
  for (const [tableName, { entity, children }] of resolved) {
    const fields = {};
    for (const col of entity.columns) {
      fields[col.columnName] = fieldHelpText(entity, col);
    }
    help[tableName] = {
      window: windowHelpText(entity, children),
      tab: tabHelpText(entity),
      fields
    };
  }
  return help;
}

// packages/generator/src/generators/tanstack-astryx-loco/dictionary-seed.ts
var NAMESPACE = "6f9d3a54-1b0e-4c9a-9f2a-8e5d4b7c1a30";
function uuidv5(name, namespace = NAMESPACE) {
  const hex = namespace.replace(/-/g, "");
  const ns = Buffer.from(hex, "hex");
  const hash = createHash("sha1").update(ns).update(Buffer.from(name, "utf8")).digest();
  hash[6] = hash[6] & 15 | 80;
  hash[8] = hash[8] & 63 | 128;
  const b = hash.subarray(0, 16).toString("hex");
  return `${b.slice(0, 8)}-${b.slice(8, 12)}-${b.slice(12, 16)}-${b.slice(16, 20)}-${b.slice(20, 32)}`;
}
function lit(value) {
  if (value === null || value === undefined)
    return "NULL";
  if (typeof value === "boolean")
    return value ? "TRUE" : "FALSE";
  if (typeof value === "number")
    return Number.isFinite(value) ? String(value) : "NULL";
  return `'${value.replace(/'/g, "''")}'`;
}
var SYSTEM_TIMESTAMPS = ["created_at", "updated_at", "deleted_at"];

class RawSql {
  sql;
  constructor(sql) {
    this.sql = sql;
  }
}
function raw(sql) {
  return new RawSql(sql);
}
function narrowingRules(entity, attribute, entities) {
  const tables = new Set(entities.map((candidate) => candidate.tableName));
  const byTable = new Map(entities.map((candidate) => [candidate.tableName, candidate]));
  const target = foreignKeyTargetTable(attribute.columnName, tables, attribute.referencesTable);
  const targetEntity = target ? byTable.get(target) : undefined;
  if (!targetEntity)
    return [];
  const rules = [];
  for (const by of attribute.narrowedBy ?? []) {
    const controlling = entity.attributes.find((candidate) => candidate.columnName === by);
    if (!controlling)
      continue;
    const controlled = foreignKeyTargetTable(by, tables, controlling.referencesTable);
    if (!controlled || controlled === targetEntity.tableName)
      continue;
    const on = targetEntity.attributes.find((candidate) => candidate.isForeignKey && foreignKeyTargetTable(candidate.columnName, tables, candidate.referencesTable) === controlled);
    if (on)
      rules.push({ by, on: on.columnName });
  }
  return rules;
}
function dataEntitiesInOrder(withData, tables) {
  const byTable = new Map(withData.map((entity) => [entity.tableName, entity]));
  const dependsOn = (entity) => entity.attributes.flatMap((attribute) => {
    const target = foreignKeyTargetTable(attribute.columnName, tables, attribute.referencesTable);
    return target && target !== entity.tableName && byTable.has(target) ? [target] : [];
  });
  const ordered = [];
  const done = new Set;
  const visit = (entity, stack) => {
    if (done.has(entity.tableName) || stack.includes(entity.tableName))
      return;
    for (const target of dependsOn(entity))
      visit(byTable.get(target), [...stack, entity.tableName]);
    done.add(entity.tableName);
    ordered.push(entity);
  };
  for (const entity of withData)
    visit(entity, []);
  return ordered;
}
function enumValueLabel(value) {
  return value.split("_").map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()).join(" ");
}
function insert(table, values) {
  const columns = Object.keys(values);
  const rendered = columns.map((column) => {
    const value = values[column];
    return value instanceof RawSql ? value.sql : lit(value);
  });
  return `INSERT INTO ${table} (${columns.join(", ")})
` + `VALUES (${rendered.join(", ")})
` + `ON CONFLICT DO NOTHING;`;
}
var NOW = raw("NOW()");
var REFERENCES = [
  { id: 10, name: "String", description: "Variable length string", validation: "S" },
  { id: 11, name: "Integer", description: "Whole number", validation: "S" },
  { id: 12, name: "Amount", description: "Decimal number for amounts", validation: "S" },
  { id: 13, name: "ID", description: "Unique identifier (UUID)", validation: "S" },
  { id: 14, name: "Text", description: "Long text/memo field", validation: "S" },
  { id: 15, name: "Date", description: "Date only", validation: "S" },
  { id: 16, name: "DateTime", description: "Date and time", validation: "S" },
  { id: 17, name: "List", description: "Dropdown list from sys_ref_list", validation: "L" },
  { id: 18, name: "Table", description: "Reference to another table", validation: "T" },
  {
    id: 19,
    name: "Table Direct",
    description: "Direct reference using column name",
    validation: "T"
  },
  { id: 20, name: "Yes-No", description: "Boolean yes/no", validation: "S" },
  { id: 24, name: "URL", description: "Web URL", validation: "S" },
  { id: 28, name: "JSON", description: "JSON data", validation: "S" },
  { id: 30, name: "Email", description: "Email address", validation: "S" },
  { id: 31, name: "Phone", description: "Phone number", validation: "S" },
  { id: 100, name: "EntityType", description: "Entity type classification", validation: "L" },
  {
    id: 101,
    name: "AccessLevel",
    description: "Access level for windows and tables",
    validation: "L"
  }
];
var REF_LISTS = [
  { referenceId: 100, value: "S", name: "System Only" },
  { referenceId: 100, value: "C", name: "Client" },
  { referenceId: 100, value: "O", name: "Organization" },
  { referenceId: 100, value: "U", name: "User Maintained" },
  { referenceId: 101, value: "M", name: "Maintain" },
  { referenceId: 101, value: "T", name: "Transaction" },
  { referenceId: 101, value: "Q", name: "Query" },
  { referenceId: 101, value: "A", name: "Admin Only" }
];
var ADMIN_WINDOWS = [
  { name: "Business Rules", route: "/admin/rules", icon: "shield-check" },
  { name: "Workflow Designer", route: "/admin/workflow-definitions", icon: "workflow" },
  { name: "Audit Log", route: "/admin/audit", icon: "scroll-text" },
  { name: "Table and Column", route: "/admin/tables", icon: "table-2" },
  { name: "Window, Tab and Field", route: "/admin/windows", icon: "app-window" },
  { name: "User Administration", route: "/admin/users", icon: "users" },
  { name: "Role Administration", route: "/admin/roles", icon: "user-cog" },
  { name: "System Configuration", route: "/admin/system", icon: "settings" }
];
var FIELD_GROUPS = [
  { name: "General", description: "General information fields", seqNo: 10, collapsed: false },
  { name: "Details", description: "Detailed information fields", seqNo: 20, collapsed: true },
  { name: "System", description: "System fields (audit trail)", seqNo: 30, collapsed: true }
];
function roleRef(name) {
  return raw(`(SELECT sys_role_id FROM sys_role WHERE name = ${lit(name)})`);
}
function fieldPlacement(entity, attr, index) {
  const isKey = attr.name === entity.primaryKey;
  return {
    seqNo: (index + 1) * 10,
    isDisplayed: !isKey,
    isDisplayedGrid: !isKey && index < 8,
    isReadOnly: SYSTEM_TIMESTAMPS.includes(attr.columnName)
  };
}
function screenLayout(entities) {
  const byName = new Map(entities.map((entity) => [entity.name, entity]));
  const layouts = new Map;
  for (const entity of entities) {
    const parent = entity.parentEntity ? byName.get(entity.parentEntity) : undefined;
    layouts.set(entity.tableName, {
      window: (parent ?? entity).displayName,
      tab: entity.displayName,
      fields: entity.attributes.map((attr, index) => ({
        column: attr.columnName,
        label: attr.displayName,
        ...fieldPlacement(entity, attr, index)
      })).sort((a, b) => a.seqNo - b.seqNo)
    });
  }
  return layouts;
}
function buildDictionarySeedSql(options) {
  const { projectName, entities } = options;
  const categories = options.categories ?? [];
  const createdBy = options.createdBy ?? "system";
  const help = buildDictionaryHelp(entities);
  const id = (kind, ...parts) => uuidv5(`${projectName}:${kind}:${parts.join(":")}`);
  const out = [];
  const section = (title) => {
    out.push("");
    out.push(`-- ${"-".repeat(74)}`);
    out.push(`-- ${title}`);
    out.push(`-- ${"-".repeat(74)}`);
  };
  out.push(`-- Application Dictionary seed for ${projectName}.`);
  out.push("--");
  out.push("-- Generated by @appwithai/generator — do not edit by hand; regenerate instead.");
  out.push("-- Applied by `cargo loco task seed_dictionary` and by `cargo loco db seed`.");
  out.push("--");
  out.push("-- Every statement is `ON CONFLICT DO NOTHING` over a deterministic primary");
  out.push("-- key, so running this file twice is a no-op and running it after a partial");
  out.push("-- failure completes the job.");
  section("Reference types");
  for (const reference of REFERENCES) {
    out.push(insert("sys_reference", {
      sys_reference_id: reference.id,
      name: reference.name,
      description: reference.description,
      validation_type: reference.validation,
      entity_type: "S",
      is_active: true,
      created_by: createdBy,
      updated_by: createdBy,
      created_at: NOW,
      updated_at: NOW
    }));
  }
  for (const modelEnum of options.modelEnums ?? []) {
    out.push(insert("sys_reference", {
      sys_reference_id: modelEnum.referenceId,
      name: modelEnum.name,
      description: `Values allowed for ${modelEnum.name}`,
      validation_type: modelEnum.table ? "T" : "L",
      entity_type: "U",
      is_active: true,
      created_by: createdBy,
      updated_by: createdBy,
      created_at: NOW,
      updated_at: NOW
    }));
    if (modelEnum.table)
      continue;
    for (const value of modelEnum.values) {
      out.push(insert("sys_ref_list", {
        sys_ref_list_id: id("ref_list", String(modelEnum.referenceId), value),
        sys_reference_id: modelEnum.referenceId,
        value,
        name: value.split("_").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" "),
        entity_type: "U",
        is_active: true,
        created_by: createdBy,
        updated_by: createdBy,
        created_at: NOW,
        updated_at: NOW
      }));
    }
  }
  for (const item of REF_LISTS) {
    out.push(insert("sys_ref_list", {
      sys_ref_list_id: id("ref_list", String(item.referenceId), item.value),
      sys_reference_id: item.referenceId,
      value: item.value,
      name: item.name,
      entity_type: "S",
      is_active: true,
      created_by: createdBy,
      updated_by: createdBy,
      created_at: NOW,
      updated_at: NOW
    }));
  }
  section("Roles");
  const roles = [
    {
      name: "Administrator",
      description: "Full system access",
      userLevel: "S",
      master: true
    },
    { name: "User", description: "Standard user access", userLevel: "C", master: false }
  ];
  for (const role of roles) {
    out.push(insert("sys_role", {
      sys_role_id: id("role", role.name),
      name: role.name,
      description: role.description,
      user_level: role.userLevel,
      is_master_role: role.master,
      is_can_export: true,
      is_can_report: true,
      is_personal_lock: false,
      is_personal_access: false,
      max_query_records: 0,
      is_show_accounting: false,
      entity_type: "S",
      is_active: true,
      created_by: createdBy,
      updated_by: createdBy,
      created_at: NOW,
      updated_at: NOW
    }));
  }
  section("Field groups");
  for (const group of FIELD_GROUPS) {
    out.push(insert("sys_field_group", {
      sys_field_group_id: id("field_group", group.name),
      name: group.name,
      description: group.description,
      seq_no: group.seqNo,
      columns: 2,
      field_group_type: "C",
      is_collapsed_by_default: group.collapsed,
      entity_type: "D",
      is_active: true,
      created_by: createdBy,
      updated_by: createdBy,
      created_at: NOW,
      updated_at: NOW
    }));
  }
  const generalGroup = id("field_group", "General");
  const detailsGroup = id("field_group", "Details");
  const entityByName = new Map(entities.map((entity) => [entity.name, entity]));
  const ancestorsOf = (entity) => {
    const chain = [];
    let current = entity;
    while (current.parentEntity) {
      const parent = entityByName.get(current.parentEntity);
      if (!parent || parent === entity || chain.includes(parent))
        break;
      chain.push(parent);
      current = parent;
    }
    return chain;
  };
  const ordered = [...entities].sort((a, b) => ancestorsOf(a).length - ancestorsOf(b).length);
  const childSeqByWindow = new Map;
  const nextChildSeq = (window2) => {
    const seq = (childSeqByWindow.get(window2) ?? 10) + 10;
    childSeqByWindow.set(window2, seq);
    return seq;
  };
  for (const entity of ordered) {
    section(`${entity.displayName} (${entity.tableName})`);
    const tableId = id("table", entity.tableName);
    const tabId = id("tab", entity.tableName);
    const ancestors = ancestorsOf(entity);
    const parentTable = ancestors.length ? ancestors[ancestors.length - 1].tableName : undefined;
    const isChild = !!parentTable;
    const windowId = id("window", parentTable ?? entity.tableName);
    const entityHelp = help[entity.tableName];
    if (!isChild) {
      out.push(insert("sys_window", {
        sys_window_id: windowId,
        name: entity.displayName,
        description: `Maintain ${entity.displayName} records`,
        help: entityHelp?.window ?? null,
        ...entity.icon ? { icon: entity.icon } : {},
        window_type: "M",
        is_sales_transaction: false,
        is_default: true,
        entity_type: "U",
        is_active: true,
        created_by: createdBy,
        updated_by: createdBy,
        created_at: NOW,
        updated_at: NOW
      }));
    }
    out.push(insert("sys_table", {
      sys_table_id: tableId,
      table_name: entity.tableName,
      name: entity.displayName,
      description: entity.description || `Manage ${entity.displayName} records`,
      ...entity.icon ? { icon: entity.icon } : {},
      ...entity.concurrency === "last-write-wins" ? { concurrency_mode: "last-write-wins" } : {},
      access_level: "A",
      is_view: false,
      is_document: false,
      is_high_volume: false,
      is_changelog: true,
      sys_window_id: windowId,
      entity_type: "U",
      is_active: true,
      created_by: createdBy,
      updated_by: createdBy,
      created_at: NOW,
      updated_at: NOW
    }));
    out.push(insert("sys_tab", {
      sys_tab_id: tabId,
      sys_window_id: windowId,
      sys_table_id: tableId,
      name: entity.displayName,
      help: entityHelp?.tab ?? null,
      tab_level: ancestors.length,
      seq_no: isChild ? nextChildSeq(windowId) : 10,
      is_single_row: true,
      has_tree: false,
      is_info_tab: false,
      is_translation_tab: false,
      is_read_only: false,
      is_insert_record: true,
      is_advanced_tab: false,
      entity_type: "U",
      is_active: true,
      created_by: createdBy,
      updated_by: createdBy,
      created_at: NOW,
      updated_at: NOW
    }));
    entity.attributes.forEach((attr, index) => {
      const isKey = attr.name === entity.primaryKey;
      const isSystemTimestamp = SYSTEM_TIMESTAMPS.includes(attr.columnName);
      out.push(insert("sys_column", {
        sys_column_id: id("column", entity.tableName, attr.columnName),
        sys_table_id: tableId,
        column_name: attr.columnName,
        name: attr.displayName,
        description: attr.description || null,
        sys_reference_id: attr.referenceId,
        field_length: attr.maxLength ?? null,
        default_value: attr.default === undefined ? null : String(attr.default),
        is_key: isKey,
        is_parent: attr.columnName === entity.parentLinkColumn,
        is_mandatory: isSystemTimestamp ? false : attr.required === true,
        is_updateable: !isKey && !isSystemTimestamp,
        is_identifier: attr.isIdentifier,
        is_selection_column: attr.name === "name" || attr.unique === true,
        is_translated: false,
        is_encrypted: false,
        is_allow_logging: true,
        is_allow_copy: !isKey,
        seq_no: (index + 1) * 10,
        entity_type: "U",
        is_active: true,
        created_by: createdBy,
        updated_by: createdBy,
        created_at: NOW,
        updated_at: NOW
      }));
    });
    for (const attr of entity.attributes) {
      if (!attr.referencesTable)
        continue;
      out.push(`UPDATE sys_column SET ref_table_name = ${lit(attr.referencesTable)} ` + `WHERE sys_column_id = ${lit(id("column", entity.tableName, attr.columnName))};`);
    }
    for (const attr of entity.attributes) {
      if (!attr.narrowedBy?.length)
        continue;
      const rules = narrowingRules(entity, attr, entities);
      if (!rules.length)
        continue;
      out.push(`UPDATE sys_column SET narrowed_by = ${lit(JSON.stringify(rules))} ` + `WHERE sys_column_id = ${lit(id("column", entity.tableName, attr.columnName))};`);
    }
    if (isChild && entity.parentLinkColumn) {
      out.push(`UPDATE sys_tab SET link_column_id = ${lit(id("column", entity.tableName, entity.parentLinkColumn))} WHERE sys_tab_id = ${lit(tabId)};`);
    }
    entity.attributes.forEach((attr, index) => {
      const placement = fieldPlacement(entity, attr, index);
      out.push(insert("sys_field", {
        sys_field_id: id("field", entity.tableName, attr.columnName),
        sys_tab_id: tabId,
        sys_column_id: id("column", entity.tableName, attr.columnName),
        sys_field_group_id: index < 3 ? generalGroup : detailsGroup,
        name: attr.displayName,
        help: entityHelp?.fields[attr.columnName] ?? null,
        seq_no: placement.seqNo,
        seq_no_grid: placement.seqNo,
        is_displayed: placement.isDisplayed,
        is_displayed_grid: placement.isDisplayedGrid,
        is_read_only: placement.isReadOnly,
        is_encrypted: false,
        is_same_line: false,
        is_heading: false,
        is_field_only: false,
        entity_type: "U",
        is_active: true,
        created_by: createdBy,
        updated_by: createdBy,
        created_at: NOW,
        updated_at: NOW
      }));
    });
    out.push(insert("sys_access", {
      sys_access_id: id("access", "Administrator", entity.tableName),
      sys_role_id: roleRef("Administrator"),
      sys_table_id: tableId,
      sys_window_id: windowId,
      access_type_table: "W",
      is_read_only: false,
      is_exclude: false,
      entity_type: "U",
      is_active: true,
      created_by: createdBy,
      updated_by: createdBy,
      created_at: NOW,
      updated_at: NOW
    }));
    out.push(insert("sys_access", {
      sys_access_id: id("access", "User", entity.tableName),
      sys_role_id: roleRef("User"),
      sys_table_id: tableId,
      sys_window_id: windowId,
      access_type_table: "R",
      is_read_only: true,
      is_exclude: false,
      entity_type: "U",
      is_active: true,
      created_by: createdBy,
      updated_by: createdBy,
      created_at: NOW,
      updated_at: NOW
    }));
  }
  const dataTables = new Set(entities.map((entity) => entity.tableName));
  const withData = entities.filter((entity) => entity.data);
  if (withData.length)
    section("Reference data (shared by every application of the common specification)");
  for (const entity of dataEntitiesInOrder(withData, dataTables)) {
    const data = entity.data;
    const keyOf = (table, value) => uuidv5(`${projectName}:data:${table}:${value}`);
    const foreignKeys = new Map;
    for (const attribute of entity.attributes) {
      const target = foreignKeyTargetTable(attribute.columnName, dataTables, attribute.referencesTable);
      if (target)
        foreignKeys.set(attribute.columnName, target);
    }
    for (const row of data.rows) {
      const own = row[data.key];
      if (own === undefined || own === null)
        continue;
      const values = { [entity.primaryKey ?? "id"]: keyOf(entity.tableName, own) };
      for (const [column, value] of Object.entries(row)) {
        const target = foreignKeys.get(column);
        values[column] = target && value !== null ? keyOf(target, value) : value;
      }
      out.push(insert(entity.tableName, values));
    }
  }
  const tableEnums = (options.modelEnums ?? []).filter((declared) => declared.table);
  if (tableEnums.length)
    section("Enumeration tables (the values of every enumeration)");
  for (const modelEnum of tableEnums) {
    const entity = entities.find((candidate) => candidate.name === modelEnum.name);
    if (!entity)
      continue;
    const columnId = (name) => id("column", entity.tableName, name);
    modelEnum.values.forEach((value, position) => {
      out.push(insert(entity.tableName, {
        id: id("enum_value", modelEnum.name, value),
        code: value,
        name: modelEnum.labels?.[value] ?? enumValueLabel(value),
        description: modelEnum.descriptions?.[value] ?? null,
        sequence: (position + 1) * 10,
        is_active: true
      }));
    });
    out.push(insert("sys_ref_table", {
      sys_ref_table_id: id("ref_table", String(modelEnum.referenceId)),
      sys_reference_id: modelEnum.referenceId,
      sys_table_id: id("table", entity.tableName),
      key_column_id: columnId("code"),
      display_column_id: columnId("name"),
      is_value_displayed: false,
      order_by_clause: "sequence",
      where_clause: "is_active = true",
      entity_type: "U",
      is_active: true,
      created_by: createdBy,
      updated_by: createdBy,
      created_at: NOW,
      updated_at: NOW
    }));
  }
  section("Admin windows (Application Dictionary section on the dashboard)");
  for (const window2 of ADMIN_WINDOWS) {
    const windowId = id("admin_window", window2.name);
    out.push(insert("sys_window", {
      sys_window_id: windowId,
      name: window2.name,
      description: window2.route,
      icon: window2.icon,
      window_type: "M",
      is_sales_transaction: false,
      is_default: false,
      entity_type: "S",
      is_active: true,
      created_by: createdBy,
      updated_by: createdBy,
      created_at: NOW,
      updated_at: NOW
    }));
    out.push(insert("sys_access", {
      sys_access_id: id("admin_access", window2.name),
      sys_role_id: roleRef("Administrator"),
      sys_window_id: windowId,
      access_type_table: "W",
      is_read_only: false,
      is_exclude: false,
      entity_type: "S",
      is_active: true,
      created_by: createdBy,
      updated_by: createdBy,
      created_at: NOW,
      updated_at: NOW
    }));
  }
  if (categories.length > 0) {
    section("Entity categories");
    out.push("UPDATE sys_category SET is_default = FALSE WHERE is_default = TRUE;");
    for (const category of categories) {
      out.push(insert("sys_category", {
        sys_category_id: id("category", category.code),
        name: category.name,
        code: category.code,
        description: category.description ?? null,
        icon: category.icon ?? null,
        color: category.color ?? null,
        seq_no: category.seqNo,
        is_default: category.isDefault === true,
        is_active: true,
        created_by: createdBy,
        updated_by: createdBy,
        created_at: NOW,
        updated_at: NOW
      }));
      out.push(`UPDATE sys_category SET name = ${lit(category.name)}, ` + `description = ${lit(category.description ?? null)}, ` + `icon = ${lit(category.icon ?? null)}, ` + `color = ${lit(category.color ?? null)}, ` + `seq_no = ${category.seqNo}, ` + `is_default = ${category.isDefault === true ? "TRUE" : "FALSE"}, ` + `updated_at = NOW(), updated_by = ${lit(createdBy)} ` + `WHERE code = ${lit(category.code)};`);
    }
    for (const category of categories) {
      if (category.tables.length === 0)
        continue;
      const tableList = category.tables.map((table) => lit(table)).join(", ");
      out.push(`UPDATE sys_table SET sys_category_id = ` + `(SELECT sys_category_id FROM sys_category WHERE code = ${lit(category.code)}) ` + `WHERE table_name IN (${tableList});`);
    }
    const fallback = categories.find((category) => category.isDefault === true);
    if (fallback) {
      out.push(`UPDATE sys_table SET sys_category_id = ` + `(SELECT sys_category_id FROM sys_category WHERE code = ${lit(fallback.code)}) ` + `WHERE sys_category_id IS NULL AND table_name LIKE 'bus\\_%';`);
    }
  }
  out.push("");
  return out.join(`
`);
}

// language/index.ts
init_fs();
init_path();
var LANGUAGE_DEFINITION_PATH = (() => {
  const env = globalThis.process;
  const configured = env?.env?.APPWITHAI_LANGUAGE_FILE;
  if (configured)
    return configured;
  try {
    return path_default.join(path_default.dirname(fileURLToPath(import.meta.url)), "appwithai-language.json");
  } catch {
    return path_default.join(env?.cwd?.() ?? "/", "language", "appwithai-language.json");
  }
})();

// language/yaml/checker.ts
var LIFECYCLE_COLUMN_NAMES = new Set(["status", "state", "stage"]);
var MANAGED_COLUMN_NAMES = new Set([
  "version",
  "created_at",
  "updated_at",
  "created_by",
  "updated_by",
  "deleted_at",
  "deleted_by"
]);
var PERSON_ROLE_COLUMN_NAMES2 = new Set([
  "assigned_to",
  "author_id",
  "lab_manager_id",
  "manager_id",
  "owner_id",
  "pi_id",
  "remediation_owner",
  "remediation_owner_id",
  "user_id"
]);
var CRUD_ACTIONS = new Set([
  "create",
  "insert",
  "add",
  "read",
  "view",
  "select",
  "list",
  "update",
  "edit",
  "write",
  "modify",
  "delete",
  "remove",
  "destroy",
  "*",
  "all",
  "any"
]);

// packages/generator/src/generators/tanstack-astryx-loco/transitions-seed.ts
var NOW2 = raw("NOW()");
function statusFieldFor(tableName, columnsByTable) {
  const columns = columnsByTable.get(tableName);
  const has = (name) => columns === undefined ? false : ("has" in columns) ? columns.has(name) : columns.includes(name);
  return [...LIFECYCLE_COLUMN_NAMES].find(has) ?? "workflow_status";
}
function buildTransitionsSeedSql(options) {
  const { projectName, workflows, columnsByTable } = options;
  const id = (...parts) => uuidv5(`${projectName}:transition:${parts.join(":")}`);
  const out = [];
  out.push(`-- State-machine edges for ${projectName}, compiled from the model's state machines.`);
  out.push("--");
  out.push("-- Generated by @appwithai/generator — do not edit by hand; regenerate instead.");
  out.push("-- Applied by `cargo loco task seed_workflows` and by `cargo loco db seed`.");
  out.push("--");
  out.push("-- One row per edge the diagram draws. A status write with no matching row is");
  out.push("-- refused for every caller, the master role included: an edge the diagram");
  out.push("-- never drew is a move that does not exist, not a permission an");
  out.push("-- administrator lacks. A table with no rows here has no machine and nothing");
  out.push("-- is refused.");
  out.push("--");
  out.push("-- `[*] --> x` and `x --> [*]` are deliberately absent. They name the initial");
  out.push("-- and terminal states, not moves a caller may make; recording `[*]` as a");
  out.push("-- from-state would let any request reset a record to its starting status.");
  out.push("");
  out.push("DELETE FROM sys_workflow_states;");
  const rows = workflows.flatMap((workflow) => workflow.transitions.map((transition) => ({ workflow, transition })));
  if (rows.length === 0) {
    out.push("--");
    out.push("-- This model declares no state machines, so every status column accepts any");
    out.push("-- value the dictionary allows. The file is still emitted: `seed_workflows.rs`");
    out.push("-- embeds it with include_str!, which is resolved at compile time.");
    out.push("");
    return out.join(`
`);
  }
  for (const { workflow, transition } of rows) {
    const statusField = statusFieldFor(workflow.tableName, columnsByTable);
    out.push("");
    out.push(`-- ${workflow.name}: ${transition.from} → ${transition.to}` + (transition.trigger ? ` (${transition.trigger})` : ""));
    out.push(insert("sys_workflow_transitions", {
      sys_workflow_transition_id: id(workflow.tableName, statusField, transition.from, transition.to),
      table_name: workflow.tableName,
      status_field: statusField,
      from_state: transition.from,
      to_state: transition.to,
      transition_name: transition.trigger ?? null,
      is_active: true,
      created_at: NOW2
    }));
  }
  const stateId = (...parts) => uuidv5(`${projectName}:state:${parts.join(":")}`);
  for (const workflow of workflows) {
    if (workflow.transitions.length === 0)
      continue;
    const statusField = statusFieldFor(workflow.tableName, columnsByTable);
    out.push("");
    out.push(`-- ${workflow.name}: states`);
    workflow.states.forEach((state, index) => {
      out.push(insert("sys_workflow_states", {
        sys_workflow_state_id: stateId(workflow.tableName, statusField, state.name),
        table_name: workflow.tableName,
        status_field: statusField,
        state: state.name,
        is_initial: state.name === workflow.initial,
        is_final: workflow.terminal.includes(state.name),
        seq_no: (index + 1) * 10,
        is_active: true,
        created_at: NOW2
      }));
    });
  }
  out.push("");
  return out.join(`
`);
}

// packages/generator/src/generators/tanstack-astryx-loco/access-seed.ts
var NOW3 = raw("NOW()");
var BUILT_IN_ROLE_NAMES = new Set(["administrator", "user"]);
function buildAccessSeedSql(options) {
  const { projectName, rbac } = options;
  const createdBy = options.createdBy ?? "system";
  const id = (kind, ...parts) => uuidv5(`${projectName}:${kind}:${parts.join(":")}`);
  const out = [];
  const section = (title) => {
    out.push("");
    out.push(`-- ${"-".repeat(74)}`);
    out.push(`-- ${title}`);
    out.push(`-- ${"-".repeat(74)}`);
  };
  out.push(`-- Access rules for ${projectName}, compiled from the model's access rules.`);
  out.push("--");
  out.push("-- Generated by @appwithai/generator — do not edit by hand; regenerate instead.");
  out.push("-- Applied by `cargo loco task seed_access` and by `cargo loco db seed`.");
  out.push("--");
  out.push("-- Every statement is `ON CONFLICT DO NOTHING` over a deterministic primary");
  out.push("-- key, so running this file twice is a no-op.");
  if (rbac.operations.length === 0 && rbac.transitions.length === 0) {
    out.push("--");
    out.push("-- This model declares no access rules, so every operation stays open to any");
    out.push("-- authenticated caller. The file is still emitted: `seed_access.rs`");
    out.push("-- embeds it with include_str!, which is resolved at compile time.");
    out.push("");
    return out.join(`
`);
  }
  const derived = deriveAccess(rbac, {
    projectId: projectName.toLowerCase().replace(/[^a-z0-9]+/g, "-")
  });
  const declaredRoles = derived.roles.filter((role) => !BUILT_IN_ROLE_NAMES.has(role.name.toLowerCase()));
  if (declaredRoles.length > 0) {
    section("Roles the model named");
    for (const role of declaredRoles) {
      out.push(insert("sys_role", {
        sys_role_id: id("role", role.name),
        name: role.name,
        description: role.description,
        user_level: role.userLevel,
        is_master_role: role.isAdmin,
        is_can_export: true,
        is_can_report: true,
        is_personal_lock: false,
        is_personal_access: false,
        max_query_records: 0,
        is_show_accounting: false,
        entity_type: "U",
        is_active: true,
        created_by: createdBy,
        updated_by: createdBy,
        created_at: NOW3,
        updated_at: NOW3
      }));
    }
  }
  const entities = options.entities ?? [];
  if (declaredRoles.length > 0 && entities.length > 0) {
    section("What the model's roles may open (sys_access)");
    const tableNameByEntity = new Map(entities.map((entity) => [entity.name, entity.tableName]));
    const ownerByName = new Map(entities.map((entity) => [entity.name, entity.windowOwner]));
    const windowRoot = (name) => {
      const seen = new Set;
      let current = name;
      for (;; ) {
        const next = ownerByName.get(current) ?? current;
        if (next === current || seen.has(current))
          return current;
        seen.add(current);
        current = next;
      }
    };
    for (const role of declaredRoles) {
      for (const entity of entities) {
        const windowTable = tableNameByEntity.get(windowRoot(entity.name)) ?? entity.tableName;
        out.push(insert("sys_access", {
          sys_access_id: id("access", role.name, entity.tableName),
          sys_role_id: raw(`(SELECT sys_role_id FROM sys_role WHERE name = ${lit(role.name)})`),
          sys_table_id: id("table", entity.tableName),
          sys_window_id: id("window", windowTable),
          access_type_table: "W",
          is_read_only: false,
          is_exclude: false,
          entity_type: "U",
          is_active: true,
          created_by: createdBy,
          updated_by: createdBy,
          created_at: NOW3,
          updated_at: NOW3
        }));
      }
    }
  }
  if (rbac.operations.length > 0) {
    section("Per-operation access (sys_operation_access)");
    for (const rule of rbac.operations) {
      for (const role of rule.roles) {
        out.push(insert("sys_operation_access", {
          sys_operation_access_id: id("operation_access", rule.tableName, rule.operation, role),
          table_name: rule.tableName,
          operation: rule.operation,
          role_name: role,
          is_model_managed: true,
          is_active: true,
          created_at: NOW3,
          updated_at: NOW3
        }));
      }
    }
  }
  if (rbac.transitions.length > 0) {
    section("Per-transition access (sys_transition_access)");
    for (const rule of rbac.transitions) {
      for (const edge of rule.edges) {
        for (const role of rule.roles) {
          out.push(insert("sys_transition_access", {
            sys_transition_access_id: id("transition_access", rule.tableName, rule.transition, edge.from, edge.to, role),
            table_name: rule.tableName,
            transition: rule.transition,
            status_field: statusFieldFor(rule.tableName, options.columnsByTable ?? new Map),
            from_state: edge.from,
            to_state: edge.to,
            role_name: role,
            is_model_managed: true,
            is_active: true,
            created_at: NOW3,
            updated_at: NOW3
          }));
        }
      }
    }
  }
  out.push("");
  return out.join(`
`);
}

// packages/generator/src/generators/tanstack-astryx-loco/business-seed.ts
init_types2();
var NOW4 = raw("NOW()");
var DEFAULT_ROWS = 5;
var MANAGED = new Set([
  "created_at",
  "updated_at",
  "deleted_at",
  "version",
  "workflow_status",
  "doc_status_message"
]);
function buildBusinessSeedSql(options) {
  const { projectName } = options;
  const enumerationTables = new Set((options.modelEnums ?? []).filter((declared) => declared.table).map((declared) => declared.name));
  const entities = options.entities.filter((entity) => !enumerationTables.has(entity.name) && !entity.data);
  const dataKeys = new Map(options.entities.flatMap((entity) => entity.data ? [[entity.tableName, entity.data.rows.map((row) => row[entity.data?.key])]] : []));
  const rows = options.rowsPerEntity ?? DEFAULT_ROWS;
  const tables = new Set(options.entities.map((entity) => entity.tableName));
  const out = [];
  out.push(`-- Demonstration records for ${projectName}.`);
  out.push("--");
  out.push("-- Generated by @appwithai/generator — do not edit by hand; regenerate instead.");
  out.push("-- Applied by `cargo loco task seed_business`.");
  out.push("--");
  out.push("-- Every value is the model's own: a column with an enum takes a declared value, a");
  out.push("-- status column takes its machine's initial state, and a foreign key takes the");
  out.push("-- id of a row inserted above it. Referential integrity is left switched on —");
  out.push("-- the entities are ordered so that it holds — so a seed that got this wrong");
  out.push("-- would fail rather than fill the tables with references to nothing.");
  out.push("--");
  out.push("-- Ids are deterministic, and every statement is `ON CONFLICT DO NOTHING`, so");
  out.push("-- re-running adds nothing and regenerating does not duplicate the rows.");
  if (entities.length === 0) {
    out.push("--");
    out.push("-- This model declares no entities. The file is still emitted:");
    out.push("-- `seed_business.rs` embeds it with include_str!, resolved at compile time.");
    out.push("");
    return out.join(`
`);
  }
  const { ordered, deferred } = orderByDependency(entities, options.relationships);
  const initialStates = statusStates(options.workflows ?? [], entities);
  const enumValues = new Map((options.modelEnums ?? []).map((declared) => [declared.referenceId, declared.values]));
  const rowId = (tableName, index) => {
    const keys = dataKeys.get(tableName);
    if (keys?.length) {
      return uuidv5(`${projectName}:data:${tableName}:${keys[index % keys.length]}`);
    }
    return uuidv5(`${projectName}:business:${tableName}:${index}`);
  };
  for (const entity of ordered) {
    out.push("");
    out.push(`-- ${entity.displayName} (${entity.tableName})`);
    const deferredHere = deferred.get(entity.tableName) ?? new Set;
    for (let index = 0;index < rows; index++) {
      const values = {
        [entity.primaryKey ?? "id"]: rowId(entity.tableName, index)
      };
      const machine = initialStates.get(entity.tableName);
      for (const attribute of entity.attributes) {
        const column = attribute.columnName;
        if (column === (entity.primaryKey ?? "id") || MANAGED.has(column))
          continue;
        if (deferredHere.has(column))
          continue;
        values[column] = valueFor(attribute, {
          entity,
          index,
          rows,
          tables,
          rowId,
          enumValues,
          initialState: machine
        });
      }
      if (machine && machine.column === "workflow_status") {
        values.workflow_status = machine.state;
      }
      values.doc_status = "final";
      values.created_at = NOW4;
      values.updated_at = NOW4;
      out.push(insert(entity.tableName, values));
    }
  }
  const updates = deferredUpdates(ordered, deferred, tables, rows, rowId);
  if (updates.length > 0) {
    out.push("");
    out.push(`-- ${"-".repeat(74)}`);
    out.push("-- References that could not be written with the row");
    out.push(`-- ${"-".repeat(74)}`);
    out.push("--");
    out.push("-- These entities point at each other, so neither can be inserted second.");
    out.push("-- The row goes in without the reference and the reference is set here, once");
    out.push("-- both sides exist — the same order the dictionary seed uses for");
    out.push("-- `sys_tab.link_column_id`.");
    out.push(...updates);
  }
  out.push("");
  return out.join(`
`);
}
function valueFor(attribute, context) {
  const { index } = context;
  const column = attribute.columnName;
  if (context.initialState && column === context.initialState.column) {
    return context.initialState.state;
  }
  const declared = context.enumValues.get(attribute.referenceId);
  if (declared && declared.length > 0) {
    return declared[index % declared.length];
  }
  if (attribute.isForeignKey || isReferenceColumn(column)) {
    const target = foreignKeyTargetTable(column, context.tables, attribute.referencesTable);
    if (!target)
      return null;
    return context.rowId(target, index % context.rows);
  }
  switch (attribute.referenceId) {
    case ReferenceType.EMAIL:
      return `${slug(context.entity.displayName)}.${index + 1}@example.com`;
    case ReferenceType.URL:
      return `https://example.com/${slug(context.entity.displayName)}/${index + 1}`;
    case ReferenceType.PHONE:
      return `+1-555-01${String(index + 10).padStart(2, "0")}`;
    case ReferenceType.COLOR:
      return "#4a5568";
    case ReferenceType.PASSWORD:
      return null;
    default:
      break;
  }
  if (!attribute.required && (attribute.type === "date" || attribute.type === "datetime")) {
    return null;
  }
  switch (attribute.type) {
    case "integer":
      return index + 1;
    case "decimal":
      return raw(((index + 1) * 10.5).toFixed(2));
    case "boolean":
      return index % 2 === 0;
    case "date":
      return `2026-0${index % 9 + 1}-15`;
    case "datetime":
      return `2026-0${index % 9 + 1}-15T09:00:00Z`;
    case "json":
      return "{}";
    default:
      return label(attribute, context);
  }
}
function label(attribute, context) {
  const base = `${context.entity.displayName} ${context.index + 1}`;
  const text = attribute.isIdentifier ? base : `${attribute.displayName} ${context.index + 1}`;
  const limit = attribute.maxLength ?? 255;
  if (text.length <= limit)
    return text;
  const suffix = String(context.index + 1);
  if (limit <= suffix.length)
    return suffix.slice(0, limit);
  const words = text.slice(0, text.length - suffix.length).trimEnd();
  const head = words.slice(0, Math.max(0, limit - suffix.length - 1)).trimEnd();
  return head ? `${head} ${suffix}` : suffix;
}
function slug(displayName) {
  return displayName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}
function isReferenceColumn(column) {
  return column.endsWith("_id") || column.endsWith("_by");
}
function statusStates(workflows, entities) {
  const columnsByTable = new Map(entities.map((entity) => [
    entity.tableName,
    new Set(entity.attributes.map((attribute) => attribute.columnName))
  ]));
  const states = new Map;
  for (const workflow of workflows) {
    if (!workflow.initial)
      continue;
    const column = statusFieldFor(workflow.tableName, columnsByTable);
    states.set(workflow.tableName, { column, state: workflow.initial });
  }
  return states;
}
function orderByDependency(entities, relationships) {
  const byTable = new Map(entities.map((entity) => [entity.tableName, entity]));
  const deferred = new Map;
  const dependsOn = new Map;
  for (const relationship of relationships) {
    if (relationship.cardinality !== "oneToMany")
      continue;
    const parent = `bus_${snake(relationship.sourceEntity)}`;
    const child = `bus_${snake(relationship.targetEntity)}`;
    if (!byTable.has(parent) || !byTable.has(child) || parent === child)
      continue;
    const edges = dependsOn.get(child) ?? new Map;
    edges.set(parent, `${snake(relationship.sourceEntity)}_id`);
    dependsOn.set(child, edges);
  }
  const tables = new Set(entities.map((entity) => entity.tableName));
  for (const entity of entities) {
    for (const attribute of entity.attributes) {
      if (!attribute.isForeignKey || attribute.columnName === entity.primaryKey)
        continue;
      const target = foreignKeyTargetTable(attribute.columnName, tables, attribute.referencesTable);
      if (!target || target === entity.tableName)
        continue;
      const edges = dependsOn.get(entity.tableName) ?? new Map;
      if (!edges.has(target))
        edges.set(target, attribute.columnName);
      dependsOn.set(entity.tableName, edges);
    }
  }
  const ordered = [];
  const done = new Set;
  const onStack = new Set;
  const requiredColumn = (tableName, column) => byTable.get(tableName)?.attributes.find((attribute) => attribute.columnName === column)?.required === true;
  const requiredReach = (start) => {
    const reach = new Set([start]);
    const walk = (tableName) => {
      for (const [parent, column] of dependsOn.get(tableName) ?? []) {
        if (!requiredColumn(tableName, column) || reach.has(parent))
          continue;
        reach.add(parent);
        walk(parent);
      }
    };
    walk(start);
    return reach;
  };
  const defer = (tableName, column) => {
    const exists = byTable.get(tableName)?.attributes.some((attribute) => attribute.columnName === column);
    if (!exists)
      return;
    const columns = deferred.get(tableName) ?? new Set;
    columns.add(column);
    deferred.set(tableName, columns);
  };
  const visit = (tableName) => {
    if (done.has(tableName))
      return;
    if (onStack.has(tableName))
      return;
    onStack.add(tableName);
    for (const [parent, column] of dependsOn.get(tableName) ?? []) {
      if (onStack.has(parent)) {
        defer(tableName, column);
        continue;
      }
      if (!requiredColumn(tableName, column) && !done.has(parent) && [...requiredReach(parent)].some((table) => onStack.has(table))) {
        defer(tableName, column);
        continue;
      }
      visit(parent);
    }
    onStack.delete(tableName);
    done.add(tableName);
    const entity = byTable.get(tableName);
    if (entity)
      ordered.push(entity);
  };
  for (const entity of entities)
    visit(entity.tableName);
  return { ordered, deferred };
}
function deferredUpdates(ordered, deferred, tables, rows, rowId) {
  const out = [];
  for (const entity of ordered) {
    const columns = deferred.get(entity.tableName);
    if (!columns)
      continue;
    for (const column of columns) {
      const explicit = entity.attributes.find((attribute) => attribute.columnName === column)?.referencesTable;
      const target = foreignKeyTargetTable(column, tables, explicit);
      if (!target)
        continue;
      for (let index = 0;index < rows; index++) {
        out.push(`UPDATE ${entity.tableName} SET ${column} = '${rowId(target, index % rows)}'` + ` WHERE id = '${rowId(entity.tableName, index)}' AND ${column} IS NULL;`);
      }
    }
  }
  return out;
}
function snake(entityName) {
  return entityName.replace(/([A-Z]+)([A-Z][a-z])/g, "$1_$2").replace(/([a-z0-9])([A-Z])/g, "$1_$2").replace(/[-\s]+/g, "_").toLowerCase();
}

// packages/generator/src/generators/tanstack-astryx-loco/hook-handlers.ts
init_utils();
var HOOK_RUST_CONTRACTS = {
  beforeCreate: {
    params: "data: &mut Map<String, Value>",
    call: "data",
    returns: "()",
    body: `    let _ = data;
    Ok(())`,
    summary: "Runs before the insert. Mutate `data` to change what is written."
  },
  afterCreate: {
    params: "record: &Value",
    call: "record",
    returns: "()",
    body: `    let _ = record;
    Ok(())`,
    summary: "Runs after the insert, on the stored row. Side effects only."
  },
  beforeUpdate: {
    params: "id: Uuid, data: &mut Map<String, Value>",
    call: "id, data",
    returns: "()",
    body: `    let _ = (id, data);
    Ok(())`,
    summary: "Runs before the update. Mutate `data` to change what is written."
  },
  afterUpdate: {
    params: "record: &Value",
    call: "record",
    returns: "()",
    body: `    let _ = record;
    Ok(())`,
    summary: "Runs after the update, on the stored row. Side effects only."
  },
  beforeDelete: {
    params: "id: Uuid",
    call: "id",
    returns: "bool",
    body: `    let _ = id;
    Ok(true)`,
    summary: "Runs before the delete. Return `Ok(false)` to block it."
  },
  afterDelete: {
    params: "record: &Value",
    call: "record",
    returns: "()",
    body: `    let _ = record;
    Ok(())`,
    summary: "Runs after the delete, on the row as it was. Clean up related state."
  },
  beforeRead: {
    params: "id: Uuid",
    call: "id",
    returns: "()",
    body: `    let _ = id;
    Ok(())`,
    summary: "Runs before a single record is fetched. Return an error to refuse."
  },
  afterRead: {
    params: "record: &mut Value",
    call: "record",
    returns: "()",
    body: `    let _ = record;
    Ok(())`,
    summary: "Runs after a single record is fetched. Mutate it to shape the response."
  },
  beforeQuery: {
    params: "params: &mut HashMap<String, String>",
    call: "params",
    returns: "()",
    body: `    let _ = params;
    Ok(())`,
    summary: "Runs before the list query. Mutate `params` to scope or filter it."
  },
  afterQuery: {
    params: "rows: &mut Vec<Value>",
    call: "rows",
    returns: "()",
    body: `    let _ = rows;
    Ok(())`,
    summary: "Runs on the rows the list query returned, before `afterList`."
  },
  beforeList: {
    params: "params: &HashMap<String, String>",
    call: "params",
    returns: "()",
    body: `    let _ = params;
    Ok(())`,
    summary: "Runs before the list query, after `beforeQuery`. Return an error to refuse."
  },
  afterList: {
    params: "rows: &mut Vec<Value>",
    call: "rows",
    returns: "()",
    body: `    let _ = rows;
    Ok(())`,
    summary: "Runs on the page of rows about to be returned."
  },
  customValidate: {
    params: "data: &Map<String, Value>",
    call: "data",
    returns: "()",
    body: `    let _ = data;
    Ok(())`,
    summary: "Runs on create and on update. Return an `AppError::Validation` to refuse."
  }
};
var HOOK_DISPATCH_ORDER = [
  "beforeCreate",
  "afterCreate",
  "beforeUpdate",
  "afterUpdate",
  "beforeDelete",
  "afterDelete",
  "beforeRead",
  "afterRead",
  "beforeQuery",
  "afterQuery",
  "beforeList",
  "afterList",
  "customValidate"
];
function dispatchName(type) {
  return type.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);
}
function handlerModule(entity) {
  return snakeCase(entity);
}
function renderHandler(entity, hook) {
  const contract = HOOK_RUST_CONTRACTS[hook.type];
  const scope = hook.field ? `
/// Scoped by the model to \`${hook.field}\`.` : "";
  return `/// \`${hook.type}\` on ${entity} — declared by the model.
` + `///
` + `/// ${contract.summary}${scope}
` + `pub async fn ${snakeCase(hook.handler)}(${contract.params}) -> AppResult<${contract.returns}> {
` + `${contract.body}
` + `}
`;
}
function buildHookHandlerModule(entity, hooks) {
  const ordered = [...hooks].sort((a, b) => a.order - b.order);
  const header = `//! Lifecycle handlers for ${entity}.
` + `//!
` + `//! Declared by the model's \`hooks\` and wired up in
` + `//! \`crate::hooks\`. **The bodies are yours.** This file is written
` + `//! once and then left alone, so regenerating the project will not overwrite
` + `//! what you put here; a hook added to the model later arrives as a new stub
` + `//! appended below.
` + `//!
` + `//! Each returns \`AppResult\`, so returning an error refuses the request.

` + `use crate::errors::AppResult;
` + `#[allow(unused_imports)]
` + `use serde_json::{Map, Value};
` + `#[allow(unused_imports)]
` + `use std::collections::HashMap;
` + `#[allow(unused_imports)]
` + `use uuid::Uuid;

`;
  return header + ordered.map((hook) => renderHandler(entity, hook)).join(`
`);
}
function appendMissingHandlers(entity, hooks, existing) {
  const missing = [...hooks].sort((a, b) => a.order - b.order).filter((hook) => !new RegExp(`\\bfn\\s+${snakeCase(hook.handler)}\\s*\\(`).test(existing));
  if (missing.length === 0)
    return null;
  return `${existing.trimEnd()}

` + `// --- Added by a later generation run ---

` + missing.map((hook) => renderHandler(entity, hook)).join(`
`);
}
function buildHookHandlersMod(entities) {
  const header = `//! Per-entity lifecycle handler modules.
` + `//!
` + `//! Generated wiring — rewritten on every run. The modules it names are not.

`;
  if (entities.length === 0) {
    return `${header}// No hooks are declared in this model.
`;
  }
  return header + [...entities].sort().map((entity) => `pub mod ${handlerModule(entity)};
`).join("");
}
function buildHookRegistry(hooks) {
  const grouped = hooksByEntity(hooks);
  const entities = [...grouped.keys()].sort();
  let out = `//! The hook registry: which handler runs on which entity, for each event.
` + `//!
` + `//! Generated wiring — rewritten on every run, so a hook added to the
` + `//! model is always picked up. The handler bodies in \`handlers/\` are not
` + `//! rewritten; see that module's header.
` + `//!
` + `//! A dispatch function with no arm for an entity is a no-op, which is what
` + `//! makes it safe for the generic bus controller to call all of these
` + `//! unconditionally on every request.

` + `pub mod handlers;

` + `use crate::errors::AppResult;
` + `#[allow(unused_imports)]
` + `use serde_json::{Map, Value};
` + `#[allow(unused_imports)]
` + `use std::collections::HashMap;
` + `#[allow(unused_imports)]
` + `use uuid::Uuid;

` + `/// Normalise whatever spelling the caller used to the model's entity name.
` + `///
` + `/// \`bus_compound\`, \`compound\`, \`Compound\` and \`chemical-inventory\` all have
` + `/// to reach the same handlers, or a hook would fire from one route and not
` + `/// another.
` + `#[allow(dead_code)]
` + `fn key(entity: &str) -> String {
` + `    let trimmed = entity.strip_prefix("bus_").unwrap_or(entity);
` + `    trimmed
` + `        .chars()
` + `        .filter(|c| c.is_ascii_alphanumeric())
` + `        .map(|c| c.to_ascii_lowercase())
` + `        .collect()
` + `}
`;
  for (const type of HOOK_DISPATCH_ORDER) {
    const contract = HOOK_RUST_CONTRACTS[type];
    const fn = dispatchName(type);
    const declaring = entities.map((entity) => {
      const forEvent = (grouped.get(entity) ?? []).filter((hook) => hook.type === type).sort((a, b) => a.order - b.order);
      return forEvent.length === 0 ? null : { entity, forEvent };
    }).filter((e) => e !== null);
    const handlerPath = (entity, hook) => `handlers::${handlerModule(entity)}::${snakeCase(hook.handler)}`;
    const callsFor = (entity, forEvent, indent) => forEvent.map((hook) => `${indent}${handlerPath(entity, hook)}(${contract.call}).await?;
`).join("");
    const verdictFor = (entity, forEvent) => {
      const calls = forEvent.map((hook) => `${handlerPath(entity, hook)}(${contract.call}).await`);
      return calls.length === 1 ? calls[0] : `Ok(${calls.map((c) => `${c}?`).join(" && ")})`;
    };
    const ok = contract.returns === "bool" ? "Ok(true)" : "Ok(())";
    out += `
/// \`${type}\` — ${contract.summary}
` + `pub async fn ${fn}(entity: &str, ${contract.params}) -> AppResult<${contract.returns}> {
`;
    if (declaring.length === 0) {
      out += `    let _ = (entity, ${contract.call});
` + `    ${ok}
` + `}
`;
    } else if (declaring.length === 1) {
      const only = declaring[0];
      out += `    if key(entity) == "${key(only.entity)}" {
` + (contract.returns === "bool" ? `        return ${verdictFor(only.entity, only.forEvent)};
` : callsFor(only.entity, only.forEvent, "        ")) + `    }
` + `    ${ok}
` + `}
`;
    } else if (contract.returns === "bool") {
      out += `    match key(entity).as_str() {
` + declaring.map(({ entity, forEvent }) => `        "${key(entity)}" => ${verdictFor(entity, forEvent)},
`).join("") + `        _ => ${ok},
` + `    }
` + `}
`;
    } else {
      out += `    match key(entity).as_str() {
` + declaring.map(({ entity, forEvent }) => `        "${key(entity)}" => {
${callsFor(entity, forEvent, "            ")}        }
`).join("") + `        _ => {}
` + `    }
` + `    ${ok}
` + `}
`;
    }
  }
  return out;
}
function key(entity) {
  const trimmed = entity.startsWith("bus_") ? entity.slice(4) : entity;
  return trimmed.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
}

// packages/generator/src/generators/tanstack-astryx-loco/reports-seed.ts
var NOW5 = raw("NOW()");
function buildReportsSeedSql(options) {
  const { projectName, reports, tableForEntity } = options;
  const out = [];
  out.push(`-- Model-declared reports for ${projectName}.`);
  out.push("--");
  out.push("-- Generated by @appwithai/generator — do not edit by hand; regenerate instead.");
  out.push("-- Applied by `cargo loco task seed_reports` and by `cargo loco db seed`.");
  out.push("--");
  out.push("-- One row per report the model declares. Every statement is `ON CONFLICT DO NOTHING`");
  out.push("-- over a deterministic id and a unique name, so applying this file twice is a");
  out.push("-- no-op and regenerating never duplicates a report.");
  out.push("--");
  out.push("-- sql_text is a query the model's author wrote, stored verbatim. It is");
  out.push("-- refused unless it is a single SELECT or WITH — here, and again by the");
  out.push("-- backend before it runs.");
  out.push("");
  if (reports.length === 0) {
    out.push("-- This model declares no reports, so there is nothing to seed.");
    out.push("-- The file is still emitted: src/tasks/seed_reports.rs embeds it with");
    out.push("-- include_str!, which is resolved at compile time, so a crate generated");
    out.push("-- without it would not build.");
    out.push("");
    return out.join(`
`);
  }
  reports.forEach((report, index) => {
    out.push(insert("sys_report", {
      sys_report_id: uuidv5(`${projectName}:report:${report.name}`),
      name: report.name,
      title: report.title,
      entity_name: report.entity ?? null,
      table_name: report.entity ? tableForEntity.get(report.entity) ?? null : null,
      chart: report.chart ?? null,
      x_axis: report.x ?? null,
      y_axis: report.y ?? null,
      help: report.help ?? null,
      sql_text: report.sql,
      sort_order: index + 1,
      created_at: NOW5,
      updated_at: NOW5
    }));
  });
  out.push("");
  return out.join(`
`);
}

// packages/generator/src/generators/tanstack-astryx-loco/rules-seed.ts
var NOW6 = raw("NOW()");
var CONFLICT = [
  "ON CONFLICT (entity_name, operation, rule_name) DO UPDATE",
  "  SET jdm_content = EXCLUDED.jdm_content,",
  "      version     = sys_rule_definitions.version + 1,",
  "      is_active   = TRUE,",
  "      updated_by  = EXCLUDED.updated_by,",
  "      updated_at  = NOW()",
  "  WHERE current_setting('appwithai.rules_overwrite', true) = 'on';"
].join(`
`);
function buildRulesSeedSql(options) {
  const { projectName, rules } = options;
  const createdBy = options.createdBy ?? "system";
  const out = [];
  out.push(`-- Business rules for ${projectName}, compiled from the model's rules.`);
  out.push("--");
  out.push("-- Generated by @appwithai/generator — do not edit by hand; regenerate instead.");
  out.push("-- Applied by `cargo loco task seed_rules` and by `cargo loco db seed`.");
  out.push("--");
  out.push("-- Each statement conflicts on (entity_name, operation, rule_name) and updates");
  out.push("-- only when `appwithai.rules_overwrite` is set to 'on' — which the seed task");
  out.push("-- does not set and `POST /api/rules/migrate` does. Seeding therefore installs");
  out.push("-- what is missing and leaves an administrator's edits alone; migrating");
  out.push("-- replaces them with the model's version.");
  if (rules.length === 0) {
    out.push("--");
    out.push("-- This model declares no rules. The file is still emitted:");
    out.push("-- `seed_rules.rs` embeds it with include_str!, which is resolved at");
    out.push("-- compile time, so a crate without it does not build.");
    out.push("");
    return out.join(`
`);
  }
  for (const rule of rules) {
    out.push("");
    out.push(`-- ${rule.name} — ${rule.entity}.${rule.event} (priority ${rule.priority})`);
    const statement = insert("sys_rule_definitions", {
      id: uuidv5(`${projectName}:rule:${rule.tableName}:${rule.operation}:${rule.name}`),
      entity_name: rule.tableName,
      rule_name: rule.name,
      operation: rule.operation,
      jdm_content: rule.jdmContent,
      version: 1,
      is_active: true,
      created_by: createdBy,
      updated_by: createdBy,
      created_at: NOW6,
      updated_at: NOW6
    }).replace(/ON CONFLICT DO NOTHING;$/, CONFLICT);
    out.push(statement);
  }
  out.push("");
  return out.join(`
`);
}

// packages/generator/src/generators/tanstack-astryx-loco/system-seed.ts
var NOW7 = raw("NOW()");
var SETTINGS = [
  {
    key: "app_name",
    dataType: "string",
    category: "identity",
    description: "The application's name, shown in the sidebar and returned by GET /api/me/health. " + "Changing it renames the running application; it does not rename the database or the crate."
  },
  {
    key: "app_description",
    dataType: "text",
    category: "identity",
    description: "What this application is for. Taken from the model's description and returned " + "by GET /api/me/health."
  },
  {
    key: "ai_base_url",
    dataType: "string",
    category: "ai",
    description: "Base URL of an OpenAI-compatible endpoint for POST /api/ai/query. Empty leaves the " + "add-on answering 503. Set this and ai_model to turn natural-language querying on " + "without restarting."
  },
  {
    key: "ai_model",
    dataType: "string",
    category: "ai",
    description: "Model name asked for the query plan. Required alongside ai_base_url; either one empty " + "leaves the add-on off."
  },
  {
    key: "ai_api_key",
    dataType: "string",
    category: "ai",
    description: "Bearer token for the AI endpoint. A local server that needs none accepts any value.",
    isSensitive: true
  },
  {
    key: "electric_url",
    dataType: "string",
    category: "sync",
    description: "ElectricSQL shape-service URL behind GET /api/electric/v1/shape. Empty leaves the " + "proxy answering 503, which is the default."
  }
];
function buildSystemSeedSql(options) {
  const { projectName } = options;
  const createdBy = options.createdBy ?? "system";
  const out = [];
  out.push(`-- Settable configuration for ${projectName}.`);
  out.push("--");
  out.push("-- Generated by @appwithai/generator — do not edit by hand; regenerate instead.");
  out.push("-- Applied by `cargo loco task seed_system` and by `cargo loco db seed`.");
  out.push("--");
  out.push("-- Every statement is `ON CONFLICT DO NOTHING` over a deterministic primary");
  out.push("-- key and a unique config_key, so running this file twice is a no-op — and");
  out.push("-- regenerating an application never overwrites a value an operator set.");
  out.push("--");
  out.push("-- The rows carrying a value are the two the model names. The rest are seeded");
  out.push("-- empty on purpose: `system_config` falls through an empty row to the");
  out.push("-- settings block, so applying this file changes no behaviour at all.");
  out.push("");
  for (const setting of SETTINGS) {
    out.push(insert("sys_system", {
      sys_system_id: uuidv5(`${projectName}:system:${setting.key}`),
      config_key: setting.key,
      config_value: valueFor2(setting.key, options),
      data_type: setting.dataType,
      category: setting.category,
      description: setting.description,
      is_sensitive: setting.isSensitive ?? false,
      is_active: true,
      created_by: createdBy,
      updated_by: createdBy,
      created_at: NOW7,
      updated_at: NOW7
    }));
  }
  out.push("");
  return out.join(`
`);
}
function valueFor2(key, options) {
  if (key === "app_name")
    return options.projectName;
  if (key === "app_description")
    return options.projectDescription;
  return "";
}
var SYSTEM_SETTING_KEYS = SETTINGS.map((setting) => setting.key);

// packages/generator/src/generators/tanstack-astryx-loco/loco-backend.generator.ts
var __dirname = "/home/user/cedm-specification/app-with-ai-rust/packages/generator/src/generators/tanstack-astryx-loco";
var LOCO_CLI_MINOR = 2;
var LOCO_CLI_REQUIREMENT = "^1.2";
var LOCO_CLI_INSTALL = `cargo install loco --version ${LOCO_CLI_REQUIREMENT} --locked`;
var EXECUTABLE_STEP_TYPES = new Set([
  "UpdateEntity",
  "CreateEntity",
  "DeleteEntity",
  "Decision",
  "Formula",
  "REST"
]);
function resolveTemplateDir3(subpath) {
  const configured = "/packages/generator/templates";
  if (configured)
    return join(configured, subpath);
  const cwd = process.cwd();
  const possiblePaths = [
    join(cwd, "packages/generator/templates", subpath),
    join(cwd, "templates", subpath),
    join(cwd, "../../../packages/generator/templates", subpath),
    join(cwd, "../../packages/generator/templates", subpath),
    join(__dirname, "../../../templates", subpath)
  ];
  for (const possiblePath of possiblePaths) {
    try {
      if ((init_fs(), __toCommonJS(exports_fs)).statSync(possiblePath).isDirectory()) {
        return possiblePath;
      }
    } catch {}
  }
  const fallbackPath = join(__dirname, "../../../templates", subpath);
  console.error("Template directory not found. Tried paths:");
  for (const p of possiblePaths) {
    console.error(`  - ${p}`);
  }
  console.error(`Using fallback: ${fallbackPath}`);
  return fallbackPath;
}
var COMMON_MOD_RS = `//! Cross-cutting pieces the rest of the crate uses.

pub mod http_log;
pub mod logging;
pub mod rate_limit;
`;
function sortCargoLock(text) {
  const marker = `
[[package]]
`;
  const [head = "", ...blocks] = text.split(marker);
  const nameOf = (block) => /^name = "([^"]*)"/.exec(block)?.[1] ?? "";
  const sorted = blocks.map((block, index) => ({ block, index, name: nameOf(block) })).sort((a, b) => a.name < b.name ? -1 : a.name > b.name ? 1 : a.index - b.index);
  const bodies = sorted.map(({ block }) => block.replace(/\n+$/, ""));
  const ending = text.endsWith(`
`) ? `
` : "";
  return `${head}${bodies.map((body) => `${marker}${body}`).join(`
`)}${ending}`;
}
var RENDERED_FILES = [
  { tpl: "Cargo.toml.hbs", out: "Cargo.toml" },
  { tpl: "Cargo.lock.hbs", out: "Cargo.lock" },
  { tpl: ".cargo/config.toml.hbs", out: ".cargo/config.toml" },
  { tpl: ".env.example.hbs", out: ".env.example" },
  { tpl: "Dockerfile.hbs", out: "Dockerfile" },
  { tpl: "config/development.yaml.hbs", out: "config/development.yaml" },
  { tpl: "config/test.yaml.hbs", out: "config/test.yaml" },
  { tpl: "config/production.yaml.hbs", out: "config/production.yaml" },
  { tpl: "migration/Cargo.toml.hbs", out: "migration/Cargo.toml" },
  { tpl: "migration/src/lib.rs.hbs", out: "migration/src/lib.rs" },
  { tpl: "migration/src/m0000_auth_users.rs.hbs", out: "migration/src/m0000_auth_users.rs" },
  { tpl: "migration/src/m0001_sys_tables.rs.hbs", out: "migration/src/m0001_sys_tables.rs" },
  { tpl: "migration/src/m0002_bus_tables.rs.hbs", out: "migration/src/m0002_bus_tables.rs" },
  {
    tpl: "migration/src/m0003_workflow_support.rs.hbs",
    out: "migration/src/m0003_workflow_support.rs"
  },
  {
    tpl: "migration/src/m0004_workflow_definitions.rs.hbs",
    out: "migration/src/m0004_workflow_definitions.rs"
  },
  { tpl: "migration/src/m0005_sys_category.rs.hbs", out: "migration/src/m0005_sys_category.rs" },
  { tpl: "migration/src/m0006_audit_log.rs.hbs", out: "migration/src/m0006_audit_log.rs" },
  {
    tpl: "migration/src/m0007_audit_hash_chain.rs.hbs",
    out: "migration/src/m0007_audit_hash_chain.rs"
  },
  {
    tpl: "migration/src/m0008_model_managed_workflows.rs.hbs",
    out: "migration/src/m0008_model_managed_workflows.rs"
  },
  {
    tpl: "migration/src/m0009_sys_access_control.rs.hbs",
    out: "migration/src/m0009_sys_access_control.rs"
  },
  {
    tpl: "migration/src/m0010_dictionary_role_scope.rs.hbs",
    out: "migration/src/m0010_dictionary_role_scope.rs"
  },
  {
    tpl: "migration/src/m0011_sys_report_designs.rs.hbs",
    out: "migration/src/m0011_sys_report_designs.rs"
  },
  {
    tpl: "migration/src/m0012_sys_note.rs.hbs",
    out: "migration/src/m0012_sys_note.rs"
  },
  {
    tpl: "migration/src/m0013_workflow_definition_source.rs.hbs",
    out: "migration/src/m0013_workflow_definition_source.rs"
  },
  {
    tpl: "migration/src/m0014_sys_system.rs.hbs",
    out: "migration/src/m0014_sys_system.rs"
  },
  {
    tpl: "migration/src/m0015_sys_report.rs.hbs",
    out: "migration/src/m0015_sys_report.rs"
  },
  {
    tpl: "migration/src/m0016_sys_window_icon.rs.hbs",
    out: "migration/src/m0016_sys_window_icon.rs"
  },
  {
    tpl: "migration/src/m0017_workflow_definition_yaml.rs.hbs",
    out: "migration/src/m0017_workflow_definition_yaml.rs"
  },
  {
    tpl: "migration/src/m0018_sys_column_ref_table.rs.hbs",
    out: "migration/src/m0018_sys_column_ref_table.rs"
  },
  {
    tpl: "migration/src/m0019_sys_column_narrowed_by.rs.hbs",
    out: "migration/src/m0019_sys_column_narrowed_by.rs"
  },
  {
    tpl: "migration/src/m0020_workflow_states_and_concurrency.rs.hbs",
    out: "migration/src/m0020_workflow_states_and_concurrency.rs"
  },
  { tpl: "src/lib.rs.hbs", out: "src/lib.rs" },
  { tpl: "src/bin/main.rs.hbs", out: "src/bin/main.rs" },
  { tpl: "src/app.rs.hbs", out: "src/app.rs" },
  { tpl: "src/errors.rs.hbs", out: "src/errors.rs" },
  { tpl: "src/openapi.rs.hbs", out: "src/openapi.rs" },
  { tpl: "src/controllers/mod.rs.hbs", out: "src/controllers/mod.rs" },
  { tpl: "src/controllers/auth.rs.hbs", out: "src/controllers/auth.rs" },
  { tpl: "src/controllers/bus.rs.hbs", out: "src/controllers/bus.rs" },
  { tpl: "src/controllers/sys.rs.hbs", out: "src/controllers/sys.rs" },
  { tpl: "src/controllers/audit.rs.hbs", out: "src/controllers/audit.rs" },
  { tpl: "src/controllers/electric.rs.hbs", out: "src/controllers/electric.rs" },
  { tpl: "src/controllers/workflow.rs.hbs", out: "src/controllers/workflow.rs" },
  { tpl: "src/controllers/me.rs.hbs", out: "src/controllers/me.rs" },
  { tpl: "src/controllers/jobs.rs.hbs", out: "src/controllers/jobs.rs" },
  { tpl: "src/controllers/records.rs.hbs", out: "src/controllers/records.rs" },
  { tpl: "src/controllers/accounts.rs.hbs", out: "src/controllers/accounts.rs" },
  { tpl: "src/controllers/report.rs.hbs", out: "src/controllers/report.rs" },
  { tpl: "src/controllers/rules.rs.hbs", out: "src/controllers/rules.rs" },
  { tpl: "src/controllers/ai.rs.hbs", out: "src/controllers/ai.rs" },
  { tpl: "src/services/mod.rs.hbs", out: "src/services/mod.rs" },
  { tpl: "src/services/dictionary.rs.hbs", out: "src/services/dictionary.rs" },
  { tpl: "src/services/dynamic_repo.rs.hbs", out: "src/services/dynamic_repo.rs" },
  { tpl: "src/services/row_json.rs.hbs", out: "src/services/row_json.rs" },
  { tpl: "src/services/field_meta.rs.hbs", out: "src/services/field_meta.rs" },
  { tpl: "tests/app.rs.hbs", out: "tests/app.rs" },
  { tpl: "tests/support/mod.rs.hbs", out: "tests/support/mod.rs" },
  { tpl: "tests/support/entities.rs.hbs", out: "tests/support/entities.rs" },
  { tpl: "tests/support/factory.rs.hbs", out: "tests/support/factory.rs" },
  { tpl: "tests/requests/mod.rs.hbs", out: "tests/requests/mod.rs" },
  { tpl: "tests/requests/health.rs.hbs", out: "tests/requests/health.rs" },
  { tpl: "tests/requests/auth.rs.hbs", out: "tests/requests/auth.rs" },
  { tpl: "tests/requests/dictionary.rs.hbs", out: "tests/requests/dictionary.rs" },
  { tpl: "tests/requests/openapi.rs.hbs", out: "tests/requests/openapi.rs" },
  { tpl: "tests/requests/model_rules.rs.hbs", out: "tests/requests/model_rules.rs" },
  { tpl: "tests/requests/model_transitions.rs.hbs", out: "tests/requests/model_transitions.rs" },
  { tpl: "tests/requests/concurrency.rs.hbs", out: "tests/requests/concurrency.rs" },
  { tpl: "tests/requests/permissions.rs.hbs", out: "tests/requests/permissions.rs" },
  { tpl: "tests/requests/rate_limit.rs.hbs", out: "tests/requests/rate_limit.rs" },
  { tpl: "tests/requests/ai.rs.hbs", out: "tests/requests/ai.rs" },
  { tpl: "tests/requests/jobs.rs.hbs", out: "tests/requests/jobs.rs" },
  { tpl: "tests/requests/records.rs.hbs", out: "tests/requests/records.rs" },
  { tpl: "tests/requests/accounts.rs.hbs", out: "tests/requests/accounts.rs" },
  { tpl: "tests/requests/rbac.rs.hbs", out: "tests/requests/rbac.rs" },
  { tpl: "tests/requests/workflow.rs.hbs", out: "tests/requests/workflow.rs" },
  { tpl: "tests/requests/rules_workflow.rs.hbs", out: "tests/requests/rules_workflow.rs" },
  { tpl: "tests/requests/saga_execution.rs.hbs", out: "tests/requests/saga_execution.rs" },
  { tpl: "tests/requests/http_log.rs.hbs", out: "tests/requests/http_log.rs" },
  { tpl: "tests/requests/system_config.rs.hbs", out: "tests/requests/system_config.rs" },
  { tpl: "tests/requests/reports.rs.hbs", out: "tests/requests/reports.rs" },
  { tpl: "src/services/rules_engine.rs.hbs", out: "src/services/rules_engine.rs" },
  { tpl: "src/common/http_log.rs.hbs", out: "src/common/http_log.rs" },
  { tpl: "src/common/rate_limit.rs.hbs", out: "src/common/rate_limit.rs" },
  { tpl: "src/services/system_config.rs.hbs", out: "src/services/system_config.rs" },
  { tpl: "src/services/audit.rs.hbs", out: "src/services/audit.rs" },
  { tpl: "src/services/concurrency.rs.hbs", out: "src/services/concurrency.rs" },
  { tpl: "src/services/authz.rs.hbs", out: "src/services/authz.rs" },
  { tpl: "src/services/nl_query.rs.hbs", out: "src/services/nl_query.rs" },
  { tpl: "src/services/promotion.rs.hbs", out: "src/services/promotion.rs" },
  { tpl: "src/services/workflow.rs.hbs", out: "src/services/workflow.rs" },
  { tpl: "src/models/mod.rs.hbs", out: "src/models/mod.rs" },
  { tpl: "src/models/_entities/mod.rs.hbs", out: "src/models/_entities/mod.rs" },
  { tpl: "src/models/_entities/users.rs.hbs", out: "src/models/_entities/users.rs" },
  { tpl: "src/models/users.rs.hbs", out: "src/models/users.rs" },
  { tpl: "src/tasks/mod.rs.hbs", out: "src/tasks/mod.rs" },
  { tpl: "src/tasks/seed_dictionary.rs.hbs", out: "src/tasks/seed_dictionary.rs" },
  { tpl: "src/tasks/seed_rules.rs.hbs", out: "src/tasks/seed_rules.rs" },
  { tpl: "src/tasks/seed_system.rs.hbs", out: "src/tasks/seed_system.rs" },
  { tpl: "src/tasks/seed_business.rs.hbs", out: "src/tasks/seed_business.rs" },
  { tpl: "src/tasks/seed_reports.rs.hbs", out: "src/tasks/seed_reports.rs" },
  { tpl: "src/tasks/seed_workflows.rs.hbs", out: "src/tasks/seed_workflows.rs" },
  { tpl: "src/tasks/seed_access.rs.hbs", out: "src/tasks/seed_access.rs" },
  { tpl: "src/tasks/ensure_admin.rs.hbs", out: "src/tasks/ensure_admin.rs" },
  { tpl: "src/workers/mod.rs.hbs", out: "src/workers/mod.rs" },
  { tpl: "src/workers/email.rs.hbs", out: "src/workers/email.rs" },
  { tpl: "src/workers/report.rs.hbs", out: "src/workers/report.rs" },
  { tpl: "src/workers/sync.rs.hbs", out: "src/workers/sync.rs" }
];
var DIRECTORIES = [
  ".cargo",
  "config",
  "seed",
  "migration/src",
  "migration/sql",
  "src/bin",
  "src/common",
  "src/controllers",
  "src/services",
  "src/models/_entities",
  "src/tasks",
  "src/workers",
  "tests/requests",
  "tests/support"
];

class LocoBackendGenerator extends BaseGenerator {
  options;
  resolvedTemplateDir;
  constructor(options) {
    const templateDir = resolveTemplateDir3("tanstack-astryx-loco/backend");
    super(templateDir);
    this.options = options;
    this.resolvedTemplateDir = templateDir;
  }
  async generate(entities, relationships, outputDir) {
    if (this.options.skipCliScaffold === true) {
      console.log(`
\uD83D\uDCE6 Phase 1: Skipping CLI scaffold (template-only mode)`);
      await mkdir2(outputDir, { recursive: true });
    } else {
      console.log(`
\uD83D\uDCE6 Phase 1: Scaffolding Loco project...`);
      await this.scaffoldLocoProject(outputDir);
      await this.pruneScaffold(outputDir);
    }
    console.log(`
\uD83C\uDFA8 Phase 2: Overlaying Rust templates...`);
    const context = this.prepareContext(entities, relationships);
    for (const dir of DIRECTORIES) {
      await mkdir2(join(outputDir, dir), { recursive: true });
    }
    for (const { tpl, out } of RENDERED_FILES) {
      const content = await this.renderTemplate(tpl, context);
      await writeFile2(join(outputDir, out), out === "Cargo.lock" ? sortCargoLock(content) : content);
    }
    await this.writeLoggingModule(outputDir);
    await this.copyMigrationSql(outputDir);
    await this.writePerEntityTests(outputDir, entities, context);
    await this.writeBusEntities(outputDir, entities, context);
    await this.writeHookHandlers(outputDir);
    await this.writeDictionarySeed(entities, relationships, outputDir);
    await this.formatRustSources(outputDir);
    console.log(`
✅ Loco backend generation complete!`);
  }
  async formatRustSources(outputDir) {
    if (!CliExecutor.isCommandAvailable("cargo")) {
      console.log("  Cargo not found — skipping `cargo fmt` on the generated sources");
      return;
    }
    try {
      await CliExecutor.executeAsync("cargo", ["fmt"], {
        cwd: outputDir,
        stdio: "pipe",
        timeout: 120000
      });
      console.log("  ✓ Formatted Rust sources with cargo fmt");
    } catch (error) {
      console.warn(`  ⚠️  cargo fmt skipped: ${error.message.split(`
`)[0]}`);
    }
  }
  async scaffoldLocoProject(outputDir) {
    if (!this.hasCurrentLocoCli()) {
      await this.installLocoCli();
    }
    const projectName = basename(outputDir);
    const stagingRoot = await mkdtemp2(join(tmpdir(), "appwithai-loco-"));
    try {
      await CliExecutor.executeAsync("loco", [
        "new",
        "-n",
        projectName,
        "--db",
        "postgres",
        "--bg",
        "async",
        "--assets",
        "none",
        "--allow-in-git-repo"
      ], { cwd: stagingRoot, stdio: "inherit", timeout: 300000 });
      await mkdir2(outputDir, { recursive: true });
      await cp2(join(stagingRoot, projectName), outputDir, {
        recursive: true,
        force: true
      });
      console.log("  ✅ Loco scaffolding complete");
    } catch (error) {
      throw new Error(`\`loco new\` failed: ${error.message.split(`
`)[0]}
` + `  The scaffold is where the framework's own current defaults come from — its CI
` + `  workflow, .rustfmt.toml, AGENTS.md, .gitignore — so a backend built without it
` + `  is missing files this repo deliberately does not keep copies of.
` + "  Pass --skip-cli-scaffold to generate from templates alone (offline builds).");
    } finally {
      await rm2(stagingRoot, { recursive: true, force: true }).catch(() => {});
    }
  }
  hasCurrentLocoCli() {
    if (!CliExecutor.isCommandAvailable("loco"))
      return false;
    const match = CliExecutor.getCommandVersion("loco")?.match(/(\d+)\.(\d+)\.\d+/);
    return Boolean(match) && Number(match?.[1]) === 1 && Number(match?.[2]) >= LOCO_CLI_MINOR;
  }
  async installLocoCli() {
    if (!CliExecutor.isCommandAvailable("cargo")) {
      throw new Error("Neither `loco` nor `cargo` is on PATH. Install a Rust toolchain " + "(https://rustup.rs) — the generated backend is a cargo crate and needs one anyway.");
    }
    console.log(`  \uD83D\uDCE5 Loco CLI ${LOCO_CLI_REQUIREMENT} not found — installing it with \`${LOCO_CLI_INSTALL}\`…`);
    try {
      await CliExecutor.executeAsync("cargo", LOCO_CLI_INSTALL.split(" ").slice(1), {
        stdio: "inherit",
        timeout: 900000
      });
    } catch (error) {
      throw new Error(`\`${LOCO_CLI_INSTALL}\` failed: ${error.message.split(`
`)[0]}
` + "  Install it by hand, or pass --skip-cli-scaffold to generate from templates alone.");
    }
  }
  async writeDictionarySeed(entities, relationships, outputDir) {
    const declared = declaredEntityNames(entities);
    const busEntities = entities.map((entity) => entityToBusEntity(entity, declared));
    const tableByName = new Map(busEntities.map((entity) => [entity.name.toLowerCase(), entity.tableName]));
    const categories = (this.options.categories ?? []).map((category) => ({
      name: category.name,
      code: category.code,
      description: category.description,
      icon: category.icon,
      color: category.color,
      seqNo: category.seqNo,
      isDefault: category.isDefault,
      tables: category.entities.map((entityName) => tableByName.get(entityName.toLowerCase())).filter((tableName) => !!tableName)
    }));
    const sql = buildDictionarySeedSql({
      projectName: this.options.projectName,
      entities: busEntities,
      categories,
      modelEnums: this.options.modelEnums
    });
    await mkdir2(join(outputDir, "seed"), { recursive: true });
    await writeFile2(join(outputDir, "seed/dictionary.sql"), sql);
    console.log(`  ✓ Wrote seed/dictionary.sql (${busEntities.length} entities)`);
    await this.writeWorkflowSeed(outputDir, entities);
    await this.writeRulesSeed(outputDir);
    await this.writeTransitionsSeed(outputDir, entities);
    await this.writeAccessSeed(outputDir, entities);
    await this.writeSystemSeed(outputDir);
    await this.writeBusinessSeed(outputDir, busEntities, relationships);
    await this.writeReportsSeed(outputDir, busEntities);
  }
  async writeLoggingModule(outputDir) {
    const dir = join(outputDir, "src/common");
    await mkdir2(dir, { recursive: true });
    await writeFile2(join(dir, "mod.rs"), COMMON_MOD_RS);
    await writeFile2(join(dir, "logging.rs"), buildGeneratedLoggingModule(this.options.projectName));
  }
  async writeBusinessSeed(outputDir, entities, relationships) {
    const sql = buildBusinessSeedSql({
      projectName: this.options.projectName,
      entities,
      relationships: relationships.map((relationship) => ({
        sourceEntity: relationship.sourceEntity,
        targetEntity: relationship.targetEntity,
        cardinality: relationship.cardinality
      })),
      workflows: this.options.compiledWorkflows,
      modelEnums: this.options.modelEnums
    });
    await mkdir2(join(outputDir, "seed"), { recursive: true });
    await writeFile2(join(outputDir, "seed/business.sql"), sql);
    console.log(`  ✓ Wrote seed/business.sql (${entities.length} entities)`);
  }
  async writeSystemSeed(outputDir) {
    const sql = buildSystemSeedSql({
      projectName: this.options.projectName,
      projectDescription: this.options.projectDescription
    });
    await mkdir2(join(outputDir, "seed"), { recursive: true });
    await writeFile2(join(outputDir, "seed/system.sql"), sql);
    console.log(`  ✓ Wrote seed/system.sql (${SYSTEM_SETTING_KEYS.length} settable key(s))`);
  }
  async writeReportsSeed(outputDir, busEntities) {
    const reports = this.options.compiledReports ?? [];
    const tableForEntity = new Map(busEntities.map((entity) => [entity.name, entity.tableName]));
    const sql = buildReportsSeedSql({
      projectName: this.options.projectName,
      reports,
      tableForEntity
    });
    await mkdir2(join(outputDir, "seed"), { recursive: true });
    await writeFile2(join(outputDir, "seed/reports.sql"), sql);
    console.log(reports.length === 0 ? "  ✓ Wrote seed/reports.sql (no reports declared)" : `  ✓ Wrote seed/reports.sql (${reports.length} report(s))`);
  }
  async writeRulesSeed(outputDir) {
    const rules = this.options.compiledRules ?? [];
    const sql = buildRulesSeedSql({ projectName: this.options.projectName, rules });
    await mkdir2(join(outputDir, "seed"), { recursive: true });
    await writeFile2(join(outputDir, "seed/rules.sql"), sql);
    console.log(rules.length === 0 ? "  ✓ Wrote seed/rules.sql (no rules declared)" : `  ✓ Wrote seed/rules.sql (${rules.length} rule(s))`);
  }
  columnsByTable(entities) {
    return new Map(entities.map((entity) => entityToBusEntity(entity, declaredEntityNames(entities))).map((entity) => [
      entity.tableName,
      entity.attributes.map((attribute) => attribute.columnName ?? attribute.name)
    ]));
  }
  async writeTransitionsSeed(outputDir, entities) {
    const workflows = this.options.compiledWorkflows ?? [];
    const sql = buildTransitionsSeedSql({
      projectName: this.options.projectName,
      workflows,
      columnsByTable: this.columnsByTable(entities)
    });
    await mkdir2(join(outputDir, "seed"), { recursive: true });
    await writeFile2(join(outputDir, "seed/transitions.sql"), sql);
    const edges = workflows.reduce((total, workflow) => total + workflow.transitions.length, 0);
    console.log(edges === 0 ? "  ✓ Wrote seed/transitions.sql (no state machines declared)" : `  ✓ Wrote seed/transitions.sql (${workflows.length} machine(s), ${edges} edge(s))`);
  }
  async writeAccessSeed(outputDir, entities) {
    const rbac = this.options.compiledRbac ?? { operations: [], transitions: [] };
    const sql = buildAccessSeedSql({
      projectName: this.options.projectName,
      rbac,
      columnsByTable: this.columnsByTable(entities),
      entities: entities.map((entity) => entityToBusEntity(entity, declaredEntityNames(entities))).map((entity) => ({
        name: entity.name,
        tableName: entity.tableName,
        windowOwner: entity.windowOwner
      }))
    });
    await mkdir2(join(outputDir, "seed"), { recursive: true });
    await writeFile2(join(outputDir, "seed/access.sql"), sql);
    const rules = rbac.operations.reduce((total, rule) => total + rule.roles.length, 0);
    const edges = rbac.transitions.reduce((total, rule) => total + rule.edges.length * rule.roles.length, 0);
    console.log(rules + edges === 0 ? "  ✓ Wrote seed/access.sql (no access rules declared)" : `  ✓ Wrote seed/access.sql (${rules} operation rule(s), ${edges} transition rule(s))`);
  }
  async writeWorkflowSeed(outputDir, entities) {
    const workflows = structuredClone(this.options.sagas ?? []);
    const tableByName = new Map(entities.map((entity) => entityToBusEntity(entity, declaredEntityNames(entities))).map((entity) => [entity.name.toLowerCase(), entity.tableName]));
    for (const workflow of workflows) {
      const table = tableByName.get(workflow.entity.toLowerCase());
      if (table) {
        workflow.entity = table;
      } else if (workflow.entity) {
        console.warn(`  ⚠️  saga ${workflow.name}: entity "${workflow.entity}" is not in the model`);
      }
    }
    for (const workflow of workflows) {
      for (const step of workflow.steps) {
        if (!EXECUTABLE_STEP_TYPES.has(step.nodeType)) {
          console.warn(`  ⚠️  saga ${workflow.name}.${step.nodeId}: "${step.nodeType}" steps are declared by EML but the Loco backend has no executor for them — this step will be skipped at run time.`);
        }
      }
    }
    const seed = buildWorkflowSeedSql(workflows, this.options.projectName);
    await writeFile2(join(outputDir, "seed/workflows.sql"), seed);
    const steps = workflows.reduce((total, workflow) => total + workflow.steps.length, 0);
    console.log(workflows.length === 0 ? "  ✓ Wrote seed/workflows.sql (no sagas declared)" : `  ✓ Wrote seed/workflows.sql (${workflows.length} saga(s), ${steps} steps)`);
  }
  async pruneScaffold(outputDir) {
    const remove = [
      "migration/src/m20220101_000001_users.rs",
      "src/mailers",
      "src/dtos",
      "src/fixtures",
      "src/data",
      "examples",
      "tests"
    ];
    let removed = 0;
    for (const entry of remove) {
      try {
        await rm2(join(outputDir, entry), { recursive: true, force: true });
        removed += 1;
      } catch {}
    }
    console.log(`  ✓ Pruned ${removed} scaffold paths this architecture replaces`);
  }
  async writeHookHandlers(outputDir) {
    const hooks = this.options.compiledHooks ?? [];
    const grouped = hooksByEntity(hooks);
    const entities = [...grouped.keys()].sort();
    const hooksDir = join(outputDir, "src/hooks");
    const handlersDir = join(hooksDir, "handlers");
    await mkdir2(handlersDir, { recursive: true });
    for (const entity of entities) {
      const forEntity = grouped.get(entity) ?? [];
      const file = join(handlersDir, `${handlerModule(entity)}.rs`);
      let existing = null;
      try {
        existing = await readFile2(file, "utf-8");
      } catch {}
      if (existing === null) {
        await writeFile2(file, buildHookHandlerModule(entity, forEntity));
        continue;
      }
      const appended = appendMissingHandlers(entity, forEntity, existing);
      if (appended !== null)
        await writeFile2(file, appended);
    }
    await writeFile2(join(handlersDir, "mod.rs"), buildHookHandlersMod(entities));
    await writeFile2(join(hooksDir, "mod.rs"), buildHookRegistry(hooks));
    console.log(hooks.length === 0 ? "  ✓ src/hooks/ (no hooks declared)" : `  ✓ src/hooks/ — ${hooks.length} handler(s) across ${entities.length} entity(ies)`);
  }
  async writePerEntityTests(outputDir, entities, context) {
    const declared = declaredEntityNames(entities);
    const busEntities = entities.map((entity) => entityToBusEntity(entity, declared));
    for (const entity of busEntities) {
      const slug = entity.tableName.replace(/^bus_/, "").replace(/[^a-z0-9]+/gi, "_");
      const entityContext = { ...context, entity };
      const crud = await this.renderTemplate("tests/requests/crud_entity.rs.hbs", entityContext);
      await writeFile2(join(outputDir, "tests/requests", `crud_${slug}.rs`), crud);
      const rules = await this.renderTemplate("tests/requests/rules_entity.rs.hbs", entityContext);
      await writeFile2(join(outputDir, "tests/requests", `rules_${slug}.rs`), rules);
    }
    const fixedSuites = RENDERED_FILES.filter(({ out }) => out.startsWith("tests/requests/") && out !== "tests/requests/mod.rs").length;
    console.log(`  ✓ tests/ — ${busEntities.length * 2 + fixedSuites} request suites`);
  }
  async writeBusEntities(outputDir, entities, context) {
    const declared = declaredEntityNames(entities);
    const busEntities = entities.map((entity) => entityToBusEntity(entity, declared));
    for (const entity of busEntities) {
      const rendered = await this.renderTemplate("src/models/_entities/bus_entity.rs.hbs", {
        ...context,
        entity
      });
      await writeFile2(join(outputDir, "src/models/_entities", `${entity.tableName}.rs`), rendered);
    }
    console.log(`  ✓ src/models/_entities/ — ${busEntities.length} bus entity(ies)`);
  }
  async copyMigrationSql(outputDir) {
    const sourceDir = join(this.resolvedTemplateDir, "migration/sql");
    const targetDir = join(outputDir, "migration/sql");
    const entries = await readdir2(sourceDir);
    for (const entry of entries) {
      if (entry.endsWith(".sql")) {
        await copyFile2(join(sourceDir, entry), join(targetDir, entry));
      }
    }
  }
  prepareContext(entities, relationships) {
    const declared = declaredEntityNames(entities);
    const busEntities = entities.map((entity) => entityToBusEntity(entity, declared));
    const dictionaryEntries = entities.map((entity) => generateEntityDictionary(entity));
    const sysTables = dictionaryEntries.map((entry) => entry.dictionaryPlaceholders.table);
    const projectSnake = this.options.projectName.toLowerCase().replace(/[^a-z0-9]+/g, "_");
    const projectKebab = this.options.projectName.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const frontendPort = this.options.frontendPort ?? this.options.port + 1;
    const databaseTarget = this.options.database ?? "postgres";
    return {
      project: {
        name: this.options.projectName,
        version: this.options.projectVersion,
        description: this.options.projectDescription,
        id: projectKebab,
        snake: projectSnake
      },
      config: {
        port: this.options.port,
        frontendPort,
        corsOrigin: `http://localhost:${frontendPort}`,
        dbUser: process.env.USER || process.env.USERNAME || "postgres"
      },
      database: {
        name: `${projectSnake}_development`,
        testName: `${projectSnake}_test`,
        target: databaseTarget,
        isNeon: databaseTarget === "neon"
      },
      projectName: this.options.projectName,
      projectSnake,
      projectKebab,
      entities: busEntities,
      relationships,
      sysTables,
      categories: this.options.categories ?? [],
      reports: (this.options.compiledReports ?? []).map((report) => ({
        name: report.name
      })),
      compiledRules: (this.options.compiledRules ?? []).map((rule) => ({
        name: rule.name,
        entity: rule.entity,
        tableName: rule.tableName,
        event: rule.event,
        operation: rule.operation,
        priority: rule.priority
      })),
      compiledWorkflows: (this.options.compiledWorkflows ?? []).map((workflow) => ({
        name: workflow.name,
        entity: workflow.entity,
        tableName: workflow.tableName,
        statusField: statusFieldFor(workflow.tableName, this.columnsByTable(entities)),
        initial: workflow.initial ?? "",
        transitions: workflow.transitions,
        states: workflow.states,
        final: workflow.terminal
      })),
      access: deriveAccess(this.options.compiledRbac ?? { operations: [], transitions: [] }, {
        projectId: projectKebab,
        entities: busEntities.map((entity) => entity.name)
      }),
      now: new Date().toISOString()
    };
  }
}
// packages/generator/src/generators/tests/bun-e2e.generator.ts
init_fs();
init_path();
init_types2();
var __dirname = "/home/user/cedm-specification/app-with-ai-rust/packages/generator/src/generators/tests";
function resolveTemplateDir4(subpath) {
  const configured = "/packages/generator/templates";
  if (configured)
    return path_default.join(configured, subpath);
  const cwd = process.cwd();
  const candidates = [
    path_default.join(cwd, "packages/generator/templates", subpath),
    path_default.join(cwd, "templates", subpath),
    path_default.join(cwd, "../../../packages/generator/templates", subpath),
    path_default.join(cwd, "../../packages/generator/templates", subpath),
    path_default.join(__dirname, "../../../templates", subpath),
    path_default.join(__dirname, "../../templates", subpath)
  ];
  for (const candidate of candidates) {
    if (existsSync(candidate))
      return candidate;
  }
  return candidates[0];
}
var HARNESS_FILES = [
  "config.ts",
  "browser.ts",
  "http.ts",
  "auth.ts",
  "server.ts",
  "entities.ts",
  "factory.ts",
  "rules.ts",
  "workflows.ts",
  "manifest.ts",
  "model.ts",
  "metrics.ts",
  "report.ts",
  "harness.ts",
  "index.ts"
];
var SHARED_SUITES = [
  "00-health.test.ts",
  "01-auth.test.ts",
  "02-dictionary.test.ts",
  "02b-dictionary-layout.test.ts",
  "02c-dictionary-references.test.ts",
  "04-bulk-seed.test.ts",
  "06-rules-workflow.test.ts",
  "06b-workflow-transitions.test.ts",
  "07-workflow-random.test.ts",
  "08-users-roles.test.ts",
  "09-browser-volume.test.ts",
  "09-workflow-multistep.test.ts",
  "10-benchmark.test.ts",
  "11-performance-budget.test.ts",
  "12-optimistic-lock.test.ts"
];
var ROOT_FILES = ["package.json", "tsconfig.json", "README.md", "run.ts", "cleanup.ts"];
var EXECUTABLE_FILES = ["run.ts", "cleanup.ts"];

class BunE2ETestGenerator extends BaseGenerator {
  options;
  constructor(options) {
    super(resolveTemplateDir4("tanstack-astryx-loco/tests"));
    this.options = options;
  }
  async generate(entities, relationships, outputDir) {
    const testsDir = path_default.join(outputDir, "tests");
    await promises.mkdir(path_default.join(testsDir, "harness"), { recursive: true });
    await promises.mkdir(path_default.join(testsDir, "suites"), { recursive: true });
    const declared = declaredEntityNames(entities);
    const busEntities = entities.map((entity) => entityToBusEntity(entity, declared));
    const context = this.buildContext(busEntities, relationships);
    await this.writeRootFiles(testsDir, context);
    await this.writeHarness(testsDir, context);
    await this.writeSharedSuites(testsDir, context);
    await this.writePerEntitySuites(testsDir, busEntities, context);
    const perEntity = busEntities.length * 2;
    console.log(`   ✓ tests/ — ${SHARED_SUITES.length + perEntity} suites, ` + `${HARNESS_FILES.length} harness modules`);
  }
  buildContext(entities, relationships) {
    return {
      project: {
        name: this.options.projectName,
        version: this.options.projectVersion,
        description: this.options.projectDescription,
        id: this.options.projectName.toLowerCase().replace(/[^a-z0-9]+/g, "-")
      },
      config: {
        port: this.options.port,
        frontendPort: this.options.frontendPort,
        recordsPerEntity: this.options.recordsPerEntity ?? 1000
      },
      entities,
      relationships,
      modelEnums: this.options.modelEnums ?? [],
      stateMachines: this.stateMachines(entities),
      now: new Date().toISOString()
    };
  }
  stateMachines(entities) {
    const byEntity = new Map;
    for (const workflow of this.options.compiledWorkflows ?? []) {
      if (!byEntity.has(workflow.entity))
        byEntity.set(workflow.entity, workflow);
    }
    if (byEntity.size === 0)
      return [];
    const columnsByTable = new Map(entities.map((entity) => [
      entity.tableName,
      (entity.attributes ?? []).map((attribute) => attribute.columnName ?? attribute.name)
    ]));
    const machines = [];
    for (const entity of entities) {
      const workflow = byEntity.get(entity.originalName ?? entity.name) ?? byEntity.get(entity.name);
      if (!workflow)
        continue;
      const edges = workflow.transitions.filter((transition) => transition.from !== "[*]" && transition.to !== "[*]").map((transition) => ({
        from: transition.from,
        to: transition.to,
        trigger: transition.trigger ?? ""
      }));
      if (edges.length === 0)
        continue;
      machines.push({
        entity: entity.name,
        tableName: entity.tableName,
        statusField: statusFieldFor(entity.tableName, columnsByTable),
        initial: workflow.initial ?? "",
        terminal: workflow.terminal ?? [],
        edges
      });
    }
    return machines;
  }
  async writeRootFiles(testsDir, context) {
    for (const file of ROOT_FILES) {
      const content = await this.renderTemplate(`${file}.hbs`, context);
      await promises.writeFile(path_default.join(testsDir, file), content);
    }
    for (const file of EXECUTABLE_FILES) {
      await promises.chmod(path_default.join(testsDir, file), 493).catch(() => {});
    }
  }
  async writeHarness(testsDir, context) {
    for (const file of HARNESS_FILES) {
      const content = await this.renderTemplate(`harness/${file}.hbs`, context);
      await promises.writeFile(path_default.join(testsDir, "harness", file), content);
    }
  }
  async writeSharedSuites(testsDir, context) {
    for (const file of SHARED_SUITES) {
      const content = await this.renderTemplate(`suites/${file}.hbs`, context);
      await promises.writeFile(path_default.join(testsDir, "suites", file), content);
    }
  }
  async writePerEntitySuites(testsDir, entities, context) {
    for (const entity of entities) {
      const slug = entity.tableName.replace(/^bus_/, "").replace(/[^a-z0-9]+/gi, "-");
      const entityContext = { ...context, entity };
      const crud = await this.renderTemplate("suites/crud-entity.test.ts.hbs", entityContext);
      await promises.writeFile(path_default.join(testsDir, "suites", `03-crud.${slug}.test.ts`), crud);
      const rules = await this.renderTemplate("suites/rules-entity.test.ts.hbs", entityContext);
      await promises.writeFile(path_default.join(testsDir, "suites", `05-rules.${slug}.test.ts`), rules);
    }
  }
}

// packages/generator/src/generators/full-stack.generator.ts
var __dirname = "/home/user/cedm-specification/app-with-ai-rust/packages/generator/src/generators";
function isLocoStack(stack) {
  return stack === "tanstack-astryx-loco";
}

class FullStackGenerator {
  options;
  constructor(options) {
    this.options = options;
  }
  async generate(entities, relationships) {
    const outputDir = this.options.outputDir;
    await mkdir2(outputDir, { recursive: true });
    await this.generateTanStackAstryxLoco(entities, relationships, outputDir);
    await this.generateSharedFiles(outputDir);
    console.log(`
✅ Full-stack application generated at: ${outputDir}`);
    console.log(`   Stack: ${this.getStackDescription()}`);
    console.log(`   Entities: ${entities.length}`);
    console.log(`   Relationships: ${relationships.length}`);
    if (this.options.aiNlAddon && this.options.aiNlAddon !== "none") {
      console.log(`   AI NL Add-on: ${this.options.aiNlAddon} (${this.options.aiNlProvider || "anthropic"})`);
    }
    console.log(`
\uD83D\uDD0D Running mandatory linting checks...`);
    await this.runLintingChecks(outputDir);
  }
  async generateTanStackAstryxLoco(entities, relationships, outputDir) {
    const backendDir = join(outputDir, "backend");
    const frontendDir = join(outputDir, "frontend");
    const frontendPort = this.options.frontendPort ?? this.options.port + 1;
    if (!this.options.skipBackend) {
      console.log("\uD83D\uDCE6 Generating Loco.rs backend...");
      const backendGenerator = new LocoBackendGenerator({
        projectName: this.options.projectName,
        projectVersion: this.options.projectVersion,
        projectDescription: this.options.projectDescription,
        port: this.options.port,
        frontendPort,
        skipCliScaffold: this.options.skipCliScaffold,
        categories: this.options.categories,
        modelEnums: this.options.modelEnums,
        sagas: this.options.sagas,
        compiledRbac: this.options.compiledRbac,
        compiledRules: this.options.compiledRules,
        compiledReports: this.options.compiledReports,
        compiledWorkflows: this.options.compiledWorkflows,
        compiledHooks: this.options.compiledHooks,
        database: this.options.database
      });
      await backendGenerator.generate(entities, relationships, backendDir);
    }
    if (!this.options.skipFrontend) {
      console.log("\uD83D\uDCE6 Generating TanStack Start + Astryx frontend...");
      const frontendGenerator = new AstryxFrontendGenerator({
        projectName: this.options.projectName,
        projectVersion: this.options.projectVersion,
        projectDescription: this.options.projectDescription,
        apiBaseUrl: `http://localhost:${this.options.port}`,
        frontendPort,
        enableDarkMode: false,
        skipCliScaffold: this.options.skipCliScaffold,
        astryxTheme: this.options.astryxTheme,
        testsWorkspace: !this.options.skipTests,
        ...this.options.tanstackStartNestjs?.frontend
      });
      await frontendGenerator.generate(entities, relationships, frontendDir);
    }
    if (!this.options.skipTests) {
      console.log("\uD83E\uDDEA Generating bun:test E2E suite (stack-agnostic parity oracle)...");
      const testGenerator = new BunE2ETestGenerator({
        projectName: this.options.projectName,
        projectVersion: this.options.projectVersion,
        projectDescription: this.options.projectDescription,
        port: this.options.port,
        frontendPort,
        recordsPerEntity: this.options.recordsPerEntity,
        modelEnums: this.options.modelEnums,
        compiledWorkflows: this.options.compiledWorkflows
      });
      await testGenerator.generate(entities, relationships, outputDir);
    }
  }
  async generateSharedFiles(outputDir) {
    if (isLocoStack(this.options.stackOption)) {
      await this.generateLocoSharedFiles(outputDir);
      return;
    }
    const rootPackageJson = {
      name: this.options.projectName,
      version: this.options.projectVersion,
      description: this.options.projectDescription,
      private: true,
      workspaces: this.options.skipTests ? ["backend", "frontend"] : ["backend", "frontend", "tests"],
      scripts: {
        dev: 'concurrently "bun run dev:backend" "bun run dev:frontend"',
        "dev:backend": "cd backend && bun run start:dev",
        "dev:frontend": "cd frontend && bun run dev",
        build: "bun run build:backend && bun run build:frontend",
        "build:backend": "cd backend && bun run build",
        "build:frontend": "cd frontend && bun run build",
        "db:migrate": "cd backend && bun run migrate",
        "db:seed": "cd backend && bun run seed",
        "db:setup": "cd backend && bun run db:setup",
        test: "bun run test:backend && bun run test:frontend",
        "test:backend": "cd backend && bun run test",
        "test:frontend": "cd frontend && bun run test",
        "test:e2e": "cd tests && bun run test",
        "test:e2e:fast": "cd tests && bun run test:fast",
        "test:e2e:attach": "cd tests && bun run test:attach",
        "test:all": "bun run test && bun run test:e2e"
      },
      devDependencies: {
        concurrently: "^8.2.0"
      },
      overrides: {
        "@tanstack/router-generator": "1.97.1",
        "@tanstack/router-plugin": "1.97.1",
        "@tanstack/start-plugin": "1.97.19",
        "@tanstack/server-functions-plugin": "1.97.19",
        "@tanstack/react-cross-context": "1.97.18",
        "@tanstack/directive-functions-plugin": "1.97.19",
        "@tanstack/virtual-file-routes": "1.97.8"
      }
    };
    await writeFile2(join(outputDir, "package.json"), JSON.stringify(rootPackageJson, null, 2));
    const readme = this.generateReadme();
    await writeFile2(join(outputDir, "README.md"), readme);
    const gitignore = `# Dependencies
node_modules/

# Build output
dist/
.next/
out/

# Generated by TanStack Router on dev/build — never edit or commit
frontend/src/routeTree.gen.ts

# The chat's host homes and session logs: people's conversations, not source
chat/.data/

# Environment files
.env
.env.local
.env.*.local

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS files
.DS_Store
Thumbs.db

# Logs
*.log
npm-debug.log*

# Database
*.db
*.sqlite
`;
    await writeFile2(join(outputDir, ".gitignore"), gitignore);
    try {
      const templateDir = await this.findTemplatesDir();
      const dockerComposeTpl = join(templateDir, "tanstack-astryx-loco/docker-compose.yml.hbs");
      const tplContent = await readFile2(dockerComposeTpl, "utf-8");
      const backendPort = this.options.port;
      const frontendPort = this.options.frontendPort ?? this.options.port + 1;
      const projectId = this.options.projectName.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      const projectSnake = this.options.projectName.toLowerCase().replace(/[^a-z0-9]+/g, "_");
      const dockerCompose = tplContent.replace(/\{\{project\.name\}\}/g, this.options.projectName).replace(/\{\{project\.id\}\}/g, projectId).replace(/\{\{project\.name \| replace '-' '_'\}\}/g, projectSnake).replace(/\{\{project\.backendPort\}\}/g, String(backendPort)).replace(/\{\{project\.frontendPort\}\}/g, String(frontendPort));
      await writeFile2(join(outputDir, "docker-compose.yml"), dockerCompose);
    } catch (e) {
      console.warn(`docker-compose.yml generation skipped: ${e.message}`);
    }
    await this.copyGitHubWorkflows(outputDir);
  }
  async generateLocoSharedFiles(outputDir) {
    const rootPackageJson = {
      name: this.options.projectName,
      version: this.options.projectVersion,
      description: this.options.projectDescription,
      private: true,
      workspaces: this.options.skipTests ? ["frontend"] : ["frontend", "tests"],
      scripts: {
        dev: 'concurrently "bun run dev:backend" "bun run dev:frontend"',
        "dev:backend": "cd backend && cargo loco start --server-and-worker",
        "dev:frontend": "cd frontend && bun run dev",
        build: "bun run build:backend && bun run build:frontend",
        "build:backend": "cd backend && cargo build --release",
        "build:frontend": "cd frontend && bun run build",
        "db:migrate": "cd backend && cargo loco db migrate",
        "db:seed": "cd backend && cargo loco db seed",
        "db:setup": "cd backend && cargo loco db reset",
        test: "bun run test:backend && bun run test:frontend",
        "test:backend": "cd backend && cargo test",
        "test:frontend": "cd frontend && bun run test",
        "test:e2e": "cd tests && bun run test",
        "test:e2e:fast": "cd tests && bun run test:fast",
        "test:e2e:attach": "cd tests && bun run test:attach",
        "test:all": "bun run test && bun run test:e2e",
        lint: "cd backend && cargo clippy -- -D warnings",
        format: "cd backend && cargo fmt"
      },
      devDependencies: {
        concurrently: "^8.2.0"
      }
    };
    await writeFile2(join(outputDir, "package.json"), JSON.stringify(rootPackageJson, null, 2));
    await writeFile2(join(outputDir, "README.md"), this.generateLocoReadme());
    await this.generateDockerCompose(outputDir);
    const gitignore = `# Dependencies
node_modules/

# Rust build output
backend/target/

# Frontend build output
dist/
out/

# Generated by TanStack Router on dev/build — never edit or commit
frontend/src/routeTree.gen.ts

# The chat's host homes and session logs: people's conversations, not source
chat/.data/

# Environment files
.env
.env.local
.env.*.local

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS files
.DS_Store
Thumbs.db

# Logs
*.log
`;
    await writeFile2(join(outputDir, ".gitignore"), gitignore);
  }
  async generateDockerCompose(outputDir) {
    const templateDir = await this.findTemplatesDir();
    const frontendPort = this.options.frontendPort ?? this.options.port + 1;
    const projectSnake = this.options.projectName.toLowerCase().replace(/[^a-z0-9]+/g, "_");
    const projectId = this.options.projectName.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const target = this.options.database ?? "postgres";
    await Promise.resolve().then(() => init_loader());
    const loader = new TemplateLoader(templateDir);
    const render = await loader.load("tanstack-astryx-loco/docker-compose.yml.hbs");
    const chat = !this.options.skipFrontend;
    const context = {
      project: { name: this.options.projectName, id: projectId, snake: projectSnake },
      config: { port: this.options.port, frontendPort },
      database: {
        name: `${projectSnake}_development`,
        target,
        isNeon: target === "neon"
      },
      chat
    };
    await writeFile2(join(outputDir, "docker-compose.yml"), render(context));
    if (chat) {
      const nginx = await loader.load("tanstack-astryx-loco/docker/nginx.conf.hbs");
      await mkdir2(join(outputDir, "docker"), { recursive: true });
      await writeFile2(join(outputDir, "docker", "nginx.conf"), nginx(context));
    }
  }
  generateLocoReadme() {
    return `# ${this.options.projectName}

${this.options.projectDescription}

## Tech Stack

- **Backend**: Loco.rs (Rust) + Axum + SeaORM/sqlx + PostgreSQL
- **Frontend**: TanStack Start + Astryx design system + TanStack Query/Table/Form

### This project is bilingual, on purpose

\`cargo\` owns the backend; \`bun\` owns the frontend. The backend has no
\`package.json\` — Loco's CLI is itself a clap application, so \`cargo loco\`
provides start/migrate/seed/test/task subcommands directly. That is a
deliberate simplification, not an oversight.

## Prerequisites

- **Rust** (stable) with \`cargo\`
- **Bun.js 1.1.0+**
- PostgreSQL 14+

## Getting Started

\`\`\`bash
# Frontend dependencies
bun install

# Configure the backend
cp backend/.env.example backend/.env

# Create the schema (migrations live in backend/migration/)
bun run db:migrate
bun run db:seed
\`\`\`

## Development

\`\`\`bash
bun run dev              # backend + frontend together

# or separately
bun run dev:backend      # cargo loco start --server-and-worker (:${this.options.port})
bun run dev:frontend     # :${this.options.frontendPort ?? this.options.port + 1}
\`\`\`

The HTTP tier and the job worker can also run as separate processes:

\`\`\`bash
cd backend
cargo loco start --server-and-worker   # both
cargo loco start --worker              # workers only
\`\`\`

> The first \`cargo build\` compiles the whole dependency tree and takes
> minutes. Subsequent builds are incremental.

## Project Structure

\`\`\`
${this.options.projectName}/
├── backend/           # Loco.rs API
│   ├── src/
│   │   ├── app.rs         # Hooks impl — routes, workers, tasks
│   │   ├── controllers/   # bus (generic CRUD), sys, rules, ...
│   │   ├── services/      # dictionary cache, dynamic_repo, row_json
│   │   └── models/
│   ├── migration/     # SeaORM migration crate
│   └── config/        # development/test/production YAML
├── frontend/          # TanStack Start + Astryx
├── tests/             # bun:test E2E suites (HTTP-level)
└── package.json
\`\`\`

## Runtime UI Configuration

The UI layout is driven by the \`sys_*\` Application Dictionary and can be
changed at runtime through /admin — no redeploy:

- \`seq_no\`: field order in detail forms
- \`seq_no_grid\`: field order in list/table views

## License

MIT
`;
  }
  async findTemplatesDir() {
    const configured = "/packages/generator/templates";
    if (configured)
      return configured;
    const cwd = process.cwd();
    const candidates = [
      join(cwd, "templates"),
      join(cwd, "packages/generator/templates"),
      join(cwd, "../../../packages/generator/templates"),
      join(cwd, "../../packages/generator/templates"),
      join(__dirname, "../../templates"),
      join(__dirname, "../../../templates")
    ];
    for (const c of candidates) {
      try {
        const s = await stat2(c);
        if (s.isDirectory())
          return c;
      } catch {}
    }
    return candidates[0];
  }
  async copyGitHubWorkflows(outputDir) {
    const workflowsDir = join(outputDir, ".github", "workflows");
    await mkdir2(workflowsDir, { recursive: true });
    {
      console.log("\uD83D\uDCCB Setting up GitHub Actions workflows...");
      let templatesDir = "/packages/generator/templates";
      if (!await this.directoryExists(templatesDir)) {
        const currentDir = process.cwd();
        const possiblePaths = [
          join(currentDir, "packages/generator/templates"),
          join(currentDir, "../packages/generator/templates"),
          join(currentDir, "../../packages/generator/templates")
        ];
        for (const possiblePath of possiblePaths) {
          if (await this.directoryExists(possiblePath)) {
            templatesDir = possiblePath;
            break;
          }
        }
      }
      try {
        const frontendWorkflowsSource = join(templatesDir, "tanstack-astryx-loco/frontend/.github/workflows");
        if (await this.directoryExists(frontendWorkflowsSource)) {
          const entries = await readdir2(frontendWorkflowsSource);
          for (const entry of entries) {
            if (entry.endsWith(".hbs")) {
              const source = join(frontendWorkflowsSource, entry);
              const destName = entry.replace(".hbs", "");
              const dest = join(workflowsDir, destName);
              const content = await readFile2(source, "utf-8");
              const rendered = this.renderWorkflowTemplate(content);
              await writeFile2(dest, rendered);
              console.log(`   ✓ Created frontend workflow: ${destName}`);
            }
          }
        }
      } catch (e) {}
      try {
        const backendWorkflowsSource = join(templatesDir, "tanstack-astryx-loco/backend/.github/workflows");
        if (await this.directoryExists(backendWorkflowsSource)) {
          const entries = await readdir2(backendWorkflowsSource);
          for (const entry of entries) {
            if (entry.endsWith(".hbs")) {
              const source = join(backendWorkflowsSource, entry);
              const destName = `backend-${entry.replace(".hbs", "")}`;
              const dest = join(workflowsDir, destName);
              const content = await readFile2(source, "utf-8");
              const rendered = this.renderWorkflowTemplate(content);
              await writeFile2(dest, rendered);
              console.log(`   ✓ Created backend workflow: ${destName}`);
            }
          }
        }
      } catch (e) {}
    }
  }
  async directoryExists(dir) {
    try {
      const stat = await stat2(dir);
      return stat.isDirectory();
    } catch {
      return false;
    }
  }
  renderWorkflowTemplate(content) {
    return content.replace(/\{\{project\.name\}\}/g, this.options.projectName).replace(/\{\{project\.id\}\}/g, this.options.projectName.toLowerCase().replace(/[^a-z0-9]+/g, "-")).replace(/\{\{project\.version\}\}/g, this.options.projectVersion).replace(/\{\{project\.description\}\}/g, this.options.projectDescription);
  }
  generateReadme() {
    const stackInfo = `- **Backend**: NestJS + Fastify + Kysely
- **Frontend**: TanStack Start + Shadcn UI + TanStack Query/Table/Form`;
    return `# ${this.options.projectName}

${this.options.projectDescription}

## Tech Stack

${stackInfo}

## Features

- **Compiere-style Application Dictionary**: Runtime-configurable UI via sys_field metadata
- **sys_ Tables**: System/dictionary tables for configuration
- **bus_ Tables**: Business entity tables generated from ERD
- **Dynamic UI**: Form and table layouts driven by seq_no ordering
- **Admin Interface**: Drag-drop field reordering with immediate effect
- **ETag Concurrency**: Optimistic locking for safe concurrent edits

## Getting Started

### Prerequisites

- **Bun.js 1.1.0+** (REQUIRED runtime)
- PostgreSQL 14+ (or SQLite for development)

### Installation

\`\`\`bash
# Install dependencies
bun install

# Setup environment
cp backend/.env.example backend/.env
# Edit .env with your database credentials

# Run migrations
bun run db:migrate

# Seed initial data (sys_reference, sys_table, sys_column, sys_field)
bun run db:seed
\`\`\`

### Development

\`\`\`bash
# Start both backend and frontend
bun run dev

# Or start individually
bun run dev:backend   # Backend on http://localhost:3000
bun run dev:frontend  # Frontend on http://localhost:3001
\`\`\`

### Production Build

\`\`\`bash
bun run build
\`\`\`

## Project Structure

\`\`\`
${this.options.projectName}/
├── backend/           # NestJS API
│   ├── src/
│   │   ├── modules/
│   │   │   ├── sys/   # Application Dictionary modules
│   │   │   └── bus/   # Business entity modules
│   │   └── ...
│   ├── migrations/    # Database migrations
│   └── seeds/         # Seed data
├── frontend/          # TanStack Start App
│   ├── src/routes/
│   └── ...
└── package.json       # Root workspace config
\`\`\`

## Runtime UI Configuration

The UI layout can be modified at runtime through the admin interface:

1. Navigate to /admin
2. Select an entity to configure
3. Drag and drop fields to reorder
4. Changes take effect immediately

Field ordering is controlled by:
- \`seq_no\`: Order in detail forms
- \`seq_no_grid\`: Order in list/table views

## License

MIT
`;
  }
  async runLintingChecks(outputDir) {
    const { execFileSync } = (init_child_process(), __toCommonJS(exports_child_process));
    const runLint = (command, args, cwd) => {
      try {
        execFileSync(command, args, { cwd, stdio: "pipe", timeout: 60000 });
        return true;
      } catch (_error) {
        return false;
      }
    };
    const runGate = (command, args, cwd) => {
      try {
        execFileSync(command, args, { cwd, stdio: "pipe", timeout: 300000 });
        return { passed: true, output: "" };
      } catch (error) {
        const failure = error;
        const output = `${failure.stdout?.toString() ?? ""}${failure.stderr?.toString() ?? ""}`;
        return { passed: false, output: output.trim() };
      }
    };
    const typecheckFrontend = async (frontendDir) => {
      console.log(`
  \uD83D\uDCCB Type-checking frontend...`);
      const hasDeps = await access2(join(frontendDir, "node_modules")).then(() => true).catch(() => false);
      if (!hasDeps) {
        console.log("  ⏭️  Skipped — no node_modules (run `bun install` in frontend/)");
        return;
      }
      const hasRouteTree = await access2(join(frontendDir, "src/routeTree.gen.ts")).then(() => true).catch(() => false);
      if (!hasRouteTree) {
        console.log("  ⏭️  Skipped — src/routeTree.gen.ts not generated yet (run `bun run dev` or `bun run build` in frontend/, then `bun run type-check`)");
        return;
      }
      const { passed, output } = runGate("bun", ["run", "type-check"], frontendDir);
      if (passed) {
        console.log("  ✅ Frontend type-check passed");
        return;
      }
      const errors = output.split(`
`).filter((line) => line.includes("error TS"));
      console.warn(`  ⚠️  Frontend type-check found ${errors.length} error(s):`);
      for (const line of errors.slice(0, 20))
        console.warn(`     ${line}`);
      if (errors.length > 20)
        console.warn(`     … and ${errors.length - 20} more`);
    };
    if (isLocoStack(this.options.stackOption)) {
      if (!this.options.skipBackend) {
        console.log(`
  \uD83D\uDCCB Rust backend: skipping compile-time gates (slow on a cold tree)`);
        console.log("     Run them yourself with:");
        console.log("       cd backend && cargo clippy -- -D warnings && cargo test");
      }
      if (!this.options.skipFrontend) {
        const frontendDir = join(outputDir, "frontend");
        console.log(`
  \uD83D\uDCCB Linting Astryx frontend...`);
        const frontendHasDeps = await access2(join(frontendDir, "node_modules")).then(() => true).catch(() => false);
        if (!frontendHasDeps) {
          console.log("  ⏭️  Skipped — no node_modules (run `bun install` in frontend/)");
        } else {
          const { passed, output } = runGate("bun", ["run", "lint"], frontendDir);
          if (passed) {
            console.log("  ✅ Frontend linting passed");
          } else {
            console.warn("  ⚠️  Frontend linting found issues:");
            for (const line of output.split(`
`).slice(0, 20))
              console.warn(`     ${line}`);
          }
        }
        await typecheckFrontend(frontendDir);
      }
      console.log(`
✨ Linting checks completed!`);
      return;
    }
    try {
      if (!this.options.skipBackend) {
        console.log(`
  \uD83D\uDCCB Linting NestJS backend...`);
        const backendLintPassed = runLint("npm", ["run", "lint"], join(outputDir, "backend"));
        if (backendLintPassed) {
          console.log("  ✅ Backend linting passed");
        } else {
          console.warn('  ⚠️  Backend linting found issues (run "cd backend && npm run lint:fix" to auto-fix)');
        }
      }
      if (!this.options.skipFrontend) {
        console.log(`
  \uD83D\uDCCB Linting TanStack Start frontend...`);
        const frontendLintPassed = runLint("npm", ["run", "lint"], join(outputDir, "frontend"));
        if (frontendLintPassed) {
          console.log("  ✅ Frontend linting passed");
        } else {
          console.warn('  ⚠️  Frontend linting found issues (run "cd frontend && npm run lint:fix" to auto-fix)');
        }
      }
      console.log(`
✨ Linting checks completed!`);
      console.log('   Tip: Run "npm run lint:fix" in backend/frontend directories to auto-fix issues');
    } catch (error) {
      console.warn("  ⚠️  Linting could not be completed (dependencies not installed?)");
      console.log('   Tip: Run "bun install" first, then run linting manually');
    }
  }
  getStackDescription() {
    return "tanstack-astryx-loco - Rust Web (TanStack Start + Astryx | Loco.rs)";
  }
}

// packages/generator/src/manual/index.ts
init_types2();
function referenceIdFor(attribute, isPrimaryKey) {
  return attributeReferenceId(attribute, isPrimaryKey ? attribute.name : undefined);
}
function tableNameFor(entity) {
  return entityToBusEntity(entity).tableName;
}
function escapeHtml(value) {
  return String(value ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
function slug2(value) {
  return String(value).replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}
var title = (value) => formatDisplayName(String(value));
var REFERENCE_NAMES = {
  [ReferenceType.STRING]: "Text",
  [ReferenceType.INTEGER]: "Whole number",
  [ReferenceType.AMOUNT]: "Amount",
  [ReferenceType.ID]: "Identifier",
  [ReferenceType.TEXT]: "Long text",
  [ReferenceType.DATE]: "Date",
  [ReferenceType.DATETIME]: "Date and time",
  [ReferenceType.LIST]: "List",
  [ReferenceType.TABLE]: "Table reference",
  [ReferenceType.TABLE_DIRECT]: "Lookup",
  [ReferenceType.YES_NO]: "Yes / No",
  [ReferenceType.URL]: "Web address",
  [ReferenceType.COLOR]: "Colour",
  [ReferenceType.JSON]: "JSON",
  [ReferenceType.PASSWORD]: "Password",
  [ReferenceType.EMAIL]: "Email address",
  [ReferenceType.PHONE]: "Telephone"
};
function controlFor(attribute, referenceId) {
  if (attribute.enumValues?.length)
    return "Choice";
  return REFERENCE_NAMES[referenceId] ?? "Text";
}
function referenceTarget(column, declared) {
  const name = column.toLowerCase();
  if (name.endsWith("_by") || name.endsWith("_by_id"))
    return "User";
  if (!name.endsWith("_id"))
    return null;
  const stem = name.slice(0, -3);
  return declared.get(stem.replace(/_/g, "")) ?? title(stem).replace(/\s+/g, "");
}
function declaredNames(model) {
  return new Map(model.entities.map((entity) => [entity.name.toLowerCase().replace(/_/g, ""), entity.name]));
}
function fieldRows(entity, declared) {
  const primaryKey = entity.primaryKey || "id";
  return entity.attributes.map((attribute) => {
    const isPrimary = attribute.name === primaryKey;
    const referenceId = referenceIdFor(attribute, isPrimary);
    const control = controlFor(attribute, referenceId);
    const constraints = [];
    if (isPrimary)
      constraints.push("key");
    if (attribute.required && !isPrimary)
      constraints.push("required");
    if (attribute.unique)
      constraints.push("unique");
    if (attribute.maxLength)
      constraints.push(`max ${attribute.maxLength}`);
    const help = attribute.description ? escapeHtml(attribute.description) : '<span class="unset">&mdash;</span>';
    const detail = [];
    if (attribute.enumValues?.length) {
      detail.push(`One of: ${attribute.enumValues.map((value) => `<code>${escapeHtml(value)}</code>`).join(", ")}`);
    }
    if (attribute.isForeignKey) {
      const target = referenceTarget(attribute.name, declared);
      if (target)
        detail.push(`Points at <b>${escapeHtml(title(target))}</b>`);
    }
    return `        <tr>
          <td><code>${escapeHtml(attribute.name)}</code></td>
          <td>${escapeHtml(control)}</td>
          <td>${constraints.length ? constraints.map((c) => `<span class="tag">${escapeHtml(c)}</span>`).join(" ") : "&mdash;"}</td>
          <td>${help}${detail.length ? `<div class="detail">${detail.join("<br>")}</div>` : ""}</td>
        </tr>`;
  }).join(`
`);
}
function relationshipPhrase(relationship, entityName) {
  const outgoing = relationship.sourceEntity === entityName;
  const other = outgoing ? relationship.targetEntity : relationship.sourceEntity;
  const link = `<a href="#entity-${slug2(other)}">${escapeHtml(title(other))}</a>`;
  switch (relationship.cardinality) {
    case "oneToMany":
      return outgoing ? `has many ${link} records` : `belongs to one ${link}`;
    case "manyToOne":
      return outgoing ? `belongs to one ${link}` : `has many ${link} records`;
    case "manyToMany":
      return `is linked to many ${link} records`;
    default:
      return `has one ${link}`;
  }
}
function relationshipsFor(model, entity) {
  const related = model.relationships.filter((relationship) => relationship.sourceEntity === entity.name || relationship.targetEntity === entity.name);
  if (related.length === 0)
    return "";
  const items = related.map((relationship) => `<li>Each <b>${escapeHtml(title(entity.name))}</b> ${relationshipPhrase(relationship, entity.name)}.</li>`).join(`
          `);
  return `      <h4>Related records</h4>
      <ul class="plain">
          ${items}
      </ul>`;
}
function screensFor(dictionary, entity) {
  const layout = dictionary.get(entity.name);
  if (!layout)
    return "";
  const rows = layout.fields.map((field) => `          <tr>
            <td><code>${escapeHtml(field.column)}</code></td>
            <td>${escapeHtml(field.label)}</td>
            <td>${field.onForm ? "Yes" : "No"}</td>
            <td>${field.inGrid ? "Yes" : "No"}</td>
            <td>${field.formSeq}</td>
            <td>${field.readOnly ? "Yes" : "No"}</td>
          </tr>`).join(`
`);
  return `      <h4>Where it appears</h4>
      <p>The application opens this record in the <b>${escapeHtml(layout.window)}</b> window, on the <b>${escapeHtml(layout.tab)}</b> tab. These are its ${layout.fields.length} field${layout.fields.length === 1 ? "" : "s"} &mdash; what the screen draws, in the order it draws them. An administrator can change any of this in Application Dictionary &rarr; Fields without regenerating the application.</p>
      <table>
        <thead><tr><th>Column</th><th>Label</th><th>On the form</th><th>In the list</th><th>Order</th><th>Read only</th></tr></thead>
        <tbody>
${rows}
        </tbody>
      </table>`;
}
function manualDictionary(model) {
  const declared = declaredEntityNames(model.entities);
  const busEntities = model.entities.map((entity) => entityToBusEntity(entity, declared));
  const layouts = screenLayout(busEntities);
  const byEntity = new Map;
  for (const entity of busEntities) {
    const layout = layouts.get(entity.tableName);
    if (!layout)
      continue;
    byEntity.set(entity.name, {
      window: layout.window,
      tab: layout.tab,
      fields: layout.fields.map((field) => ({
        column: field.column,
        label: field.label,
        onForm: field.isDisplayed,
        inGrid: field.isDisplayedGrid,
        formSeq: field.seqNo,
        readOnly: field.isReadOnly
      }))
    });
  }
  return byEntity;
}
function workflowFor(model, entity) {
  const workflows = model.workflows.filter((workflow) => workflow.entity === entity.name);
  if (workflows.length === 0)
    return "";
  return workflows.map((workflow) => {
    const rows = workflow.transitions.map((transition) => `          <tr><td><code>${escapeHtml(transition.from)}</code></td><td><code>${escapeHtml(transition.to)}</code></td><td>${transition.trigger ? `<code>${escapeHtml(transition.trigger)}</code>` : "&mdash;"}</td></tr>`).join(`
`);
    return `      <h4>Lifecycle &mdash; ${escapeHtml(workflow.name)}</h4>
      <p>A record starts at <code>${escapeHtml(workflow.initial ?? "—")}</code>${workflow.terminal.length ? ` and finishes at ${workflow.terminal.map((state) => `<code>${escapeHtml(state)}</code>`).join(" or ")}` : ""}. These are the moves it may make, and no others:</p>${workflow.terminal.length ? `
      <p>A record that reaches ${workflow.terminal.length === 1 ? "that final state" : "a final state"} is a completed transaction: the application refuses every change to it and every deletion of it, for every role, an administrator included.</p>` : ""}
      <table>
        <thead><tr><th>From</th><th>To</th><th>Event</th></tr></thead>
        <tbody>
${rows}
        </tbody>
      </table>`;
  }).join(`
`);
}
function concurrencyPhrase(entity) {
  return entity.concurrency === "last-write-wins" ? "When two people change the same record, the later save replaces the earlier one: this record is <em>last-write-wins</em>." : "When two people change the same record, the second to save is told who changed it first, when, and what, and chooses to refresh or to overwrite. A deletion is checked the same way.";
}
function rulesFor(model, entity) {
  const rules = model.rules.filter((rule) => rule.entity === entity.name);
  const hooks = model.hooks.filter((hook) => hook.entity === entity.name);
  const sagas = model.sagas.filter((saga) => saga.entity === entity.name);
  if (rules.length === 0 && hooks.length === 0 && sagas.length === 0)
    return "";
  const parts = ["      <h4>What happens when it is written</h4>"];
  if (rules.length > 0) {
    parts.push(`      <table>
        <thead><tr><th>Rule</th><th>Runs on</th><th>Order</th></tr></thead>
        <tbody>
${rules.map((rule) => `          <tr><td><code>${escapeHtml(rule.name)}</code></td><td>${escapeHtml(rule.event)} (${escapeHtml(rule.operation)})</td><td>${rule.priority}</td></tr>`).join(`
`)}
        </tbody>
      </table>`);
  }
  if (hooks.length > 0) {
    parts.push(`      <p><b>Handlers:</b> ${hooks.map((hook) => `<code>${escapeHtml(hook.type)}</code>${hook.field ? ` on <code>${escapeHtml(hook.field)}</code>` : ""}`).join(", ")}</p>`);
  }
  if (sagas.length > 0) {
    parts.push(`      <p><b>Processes:</b> ${sagas.map((saga) => `<a href="#process-${slug2(saga.name)}">${escapeHtml(saga.name)}</a>`).join(", ")}</p>`);
  }
  return parts.join(`
`);
}
function accessFor(model, entity, visibility) {
  const readers = visibility[entity.name];
  const rules = model.rbac.operations.filter((rule) => rule.entity === entity.name);
  if (!readers && rules.length === 0)
    return "";
  const parts = ["      <h4>Who may use it</h4>"];
  parts.push(readers && readers.length > 0 ? `      <p>Visible to ${readers.map((role) => `<b>${escapeHtml(title(role))}</b>`).join(", ")}, and to the Administrator. Nobody else sees it at all &mdash; it is absent from their menu rather than refused when opened.</p>` : "      <p>Visible to every signed-in user; the model places no restriction on reading it.</p>");
  const writes = rules.filter((rule) => rule.operation !== "read");
  if (writes.length > 0) {
    parts.push(`      <table>
        <thead><tr><th>Action</th><th>Permitted to</th></tr></thead>
        <tbody>
${writes.map((rule) => `          <tr><td>${escapeHtml(title(rule.operation))}</td><td>${rule.roles.map((role) => escapeHtml(title(role))).join(", ")}</td></tr>`).join(`
`)}
        </tbody>
      </table>`);
  }
  return parts.join(`
`);
}
function renderManual(model, options) {
  const generatedAt = options.generatedAt ?? new Date().toISOString();
  const access = deriveAccess(model.rbac, {
    projectId: slug2(options.name) || "app",
    adminEmail: options.adminEmail,
    entities: model.entities.map((entity) => entity.name)
  });
  const categoryOf = new Map;
  for (const category of model.categories) {
    for (const name of category.entities)
      categoryOf.set(name, category.name);
  }
  const entities = [...model.entities].sort((a, b) => a.name.localeCompare(b.name));
  const declared = declaredNames(model);
  const cliDescription = options.description?.trim();
  const overview = model.description?.trim() || (cliDescription && cliDescription !== GENERATION_DEFAULTS.projectDescription ? cliDescription : "");
  const dictionary = manualDictionary(model);
  const contents = `
      <nav class="toc" aria-label="Contents">
        <h2>Contents</h2>
        <ol>
          <li><a href="#overview">What this application is</a></li>
          <li><a href="#signing-in">Signing in, and what each role sees</a></li>
          <li><a href="#entities">The records it keeps</a>
            <ul>
${entities.map((entity) => `              <li><a href="#entity-${slug2(entity.name)}">${escapeHtml(title(entity.name))}</a></li>`).join(`
`)}
            </ul>
          </li>
${model.rules.length ? `          <li><a href="#rules">The decisions it makes</a></li>
` : ""}${model.sagas.length ? `          <li><a href="#processes">The processes it runs</a></li>
` : ""}          <li><a href="#how-it-was-built">How this application was built</a></li>
        </ol>
      </nav>`;
  const entitySections = entities.map((entity) => {
    const category = categoryOf.get(entity.name);
    return `    <section id="entity-${slug2(entity.name)}" class="entity">
      <h3>${escapeHtml(title(entity.name))}${category ? ` <span class="group">${escapeHtml(category)}</span>` : ""}</h3>
      <p class="lede">${entity.description ? escapeHtml(entity.description) : '<span class="missing">The model gives this entity no description. Add a <code>help</code> to entity <code>' + escapeHtml(entity.name) + "</code> in the model.</span>"}</p>
      <p class="meta">Stored as <code>${escapeHtml(tableNameFor(entity))}</code>, keyed by <code>${escapeHtml(entity.primaryKey || "id")}</code>.</p>
      <p class="meta">${concurrencyPhrase(entity)}</p>

      <h4>Its fields</h4>
${entity.attributes.some((attribute) => attribute.description) ? "" : `      <p class="missing">No field here carries help text. Add a <code>help</code> to a column of <code>${escapeHtml(entity.name)}</code> in the model and it appears in this column and in the application itself.</p>
`}      <table>
        <thead><tr><th>Field</th><th>Shown as</th><th></th><th>What it is for</th></tr></thead>
        <tbody>
${fieldRows(entity, declared)}
        </tbody>
      </table>
${[
      screensFor(dictionary, entity),
      relationshipsFor(model, entity),
      workflowFor(model, entity),
      rulesFor(model, entity),
      accessFor(model, entity, access.entityVisibility)
    ].filter(Boolean).join(`
`)}
      <p class="back"><a href="#top">Back to contents</a></p>
    </section>`;
  }).join(`

`);
  const rulesSection = model.rules.length ? `  <section id="rules">
    <h2>The decisions it makes</h2>
    <p>Each of these is a decision table the application evaluates when a record is written. A rule that refuses a write refuses it for everyone, including an administrator &mdash; it is a statement about the business, not about permissions.</p>
    <table>
      <thead><tr><th>Rule</th><th>Applies to</th><th>Runs on</th></tr></thead>
      <tbody>
${model.rules.map((rule) => `        <tr><td><code>${escapeHtml(rule.name)}</code></td><td><a href="#entity-${slug2(rule.entity)}">${escapeHtml(title(rule.entity))}</a></td><td>${escapeHtml(rule.event)}</td></tr>`).join(`
`)}
      </tbody>
    </table>
    <p class="back"><a href="#top">Back to contents</a></p>
  </section>` : "";
  const processSection = model.sagas.length ? `  <section id="processes">
    <h2>The processes it runs</h2>
    <p>A process spans more than one record. Its steps run in order and stop at the first failure.</p>
${model.sagas.map((saga) => `    <div id="process-${slug2(saga.name)}" class="process">
      <h3>${escapeHtml(saga.name)}</h3>
      <p class="meta">On <a href="#entity-${slug2(saga.entity)}">${escapeHtml(title(saga.entity))}</a>, ${escapeHtml(saga.trigger)} on ${escapeHtml(saga.operation)}.</p>
      <ol>
${saga.steps.map((step) => `        <li>${escapeHtml(step.label)} <span class="tag">${escapeHtml(step.nodeType)}</span></li>`).join(`
`)}
      </ol>
    </div>`).join(`
`)}
    <p class="back"><a href="#top">Back to contents</a></p>
  </section>` : "";
  const accountRows = access.users.map((user) => `        <tr><td>${escapeHtml(user.roleName)}</td><td><code>${escapeHtml(user.email)}</code></td><td>${user.isAdmin ? `all ${model.entities.length}` : `${access.entityCounts[user.roleName] ?? 0} of ${model.entities.length}`}</td></tr>`).join(`
`);
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(options.name)} &mdash; Manual</title>
<style>
/* Inline, and deliberately: this file is opened from a Service Worker, from a
   static directory, and by double-clicking it out of a zip. A stylesheet
   reference survives only the first two. */
:root {
  --bg: #ffffff; --surface: #f7f7f6; --border: #e3e3e0; --text: #17171a;
  --soft: #5f6066; --faint: #8a8b91; --accent: #0d6e6e; --accent-soft: #e6f2f2;
  --warn: #b45309;
}
@media (prefers-color-scheme: dark) {
  :root {
    --bg: #17171a; --surface: #1f1f23; --border: #33333a; --text: #ececee;
    --soft: #a9aab0; --faint: #7e7f86; --accent: #4bb3b3; --accent-soft: #14312f;
    --warn: #e0a355;
  }
}
* { box-sizing: border-box; }
body {
  margin: 0; background: var(--bg); color: var(--text);
  font: 16px/1.65 ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
}
.wrap { max-width: 60rem; margin: 0 auto; padding: 40px 24px 96px; }
header.title { border-bottom: 2px solid var(--accent); padding-bottom: 18px; margin-bottom: 8px; }
header.title h1 { margin: 0 0 6px; font-size: 30px; letter-spacing: -0.02em; }
header.title p { margin: 0; color: var(--soft); }
header.title .stamp { margin-top: 10px; font-size: 12.5px; color: var(--faint); }
h2 { font-size: 21px; margin: 44px 0 10px; letter-spacing: -0.01em; }
h3 { font-size: 18px; margin: 34px 0 6px; }
h4 { font-size: 13px; text-transform: uppercase; letter-spacing: 0.07em;
     color: var(--soft); margin: 24px 0 8px; }
p { margin: 0 0 12px; }
a { color: var(--accent); }
code {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 0.88em;
  background: var(--surface); border: 1px solid var(--border);
  border-radius: 4px; padding: 0.5px 4px;
}
.toc { background: var(--surface); border: 1px solid var(--border); border-radius: 10px;
       padding: 18px 22px; margin: 26px 0 8px; }
.toc h2 { margin: 0 0 8px; font-size: 13px; text-transform: uppercase;
          letter-spacing: 0.07em; color: var(--soft); }
.toc ol { margin: 0; padding-left: 20px; }
.toc ul { margin: 4px 0 8px; padding-left: 18px; list-style: none; }
.toc ul li { font-size: 14px; }
.toc li { margin: 3px 0; }
section { scroll-margin-top: 16px; }
.entity { border-top: 1px solid var(--border); padding-top: 8px; margin-top: 34px; }
.entity .lede { color: var(--text); }
.group { font-size: 12px; font-weight: 500; color: var(--accent);
         background: var(--accent-soft); border-radius: 999px; padding: 2px 9px;
         vertical-align: middle; margin-left: 6px; }
.meta { font-size: 13px; color: var(--faint); }
table { width: 100%; border-collapse: collapse; margin: 6px 0 4px; font-size: 14.5px; display: block; overflow-x: auto; }
thead th { text-align: left; background: var(--surface); color: var(--soft);
           font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em;
           padding: 8px 10px; border-bottom: 1px solid var(--border); white-space: nowrap; }
td { padding: 9px 10px; border-bottom: 1px solid var(--border); vertical-align: top; }
tbody tr:last-child td { border-bottom: none; }
.tag { display: inline-block; font-size: 11.5px; color: var(--soft);
       background: var(--surface); border: 1px solid var(--border);
       border-radius: 4px; padding: 1px 6px; margin-right: 3px; }
.missing { color: var(--muted); font-style: italic; }
.unset { color: var(--muted); }
.detail { margin-top: 5px; font-size: 13px; color: var(--soft); }
.app-overview { margin: 18px 0; padding: 16px 20px; background: var(--surface); border-left: 4px solid var(--accent); border-radius: 4px; font-size: 15px; line-height: 1.7; }
ul.plain { margin: 4px 0 12px; padding-left: 20px; }
.process { border-left: 3px solid var(--border); padding-left: 16px; margin: 18px 0; }
.back { margin-top: 18px; font-size: 13px; }
footer { margin-top: 56px; padding-top: 18px; border-top: 1px solid var(--border);
         color: var(--faint); font-size: 13px; }
@media print {
  .toc, .back { break-inside: avoid; }
  a { color: inherit; text-decoration: none; }
}
</style>
</head>
<body>
<div class="wrap" id="top">

  <header class="title">
    <h1>${escapeHtml(options.name)}</h1>
    <p>${escapeHtml(options.description)}</p>
    <!-- The full ISO instant rather than a friendly date, and deliberately so:
         CI generates this application twice and diffs the two trees to police
         the WASM overlay's footprint, blanking ISO timestamps first. A
         "2026-08-22" would survive that blanking and make the two copies differ
         whenever the pair of runs straddles midnight. -->
    <div class="stamp">Manual for version ${escapeHtml(options.version)} &middot; generated <time datetime="${escapeHtml(generatedAt)}">${escapeHtml(generatedAt)}</time></div>
  </header>
${contents}

  <section id="overview">
    <h2>What this application is</h2>
${overview ? `    <div class="app-overview"><p>${escapeHtml(overview)}</p></div>
` : ""}    <p>${escapeHtml(options.name)} keeps ${model.entities.length} kinds of record${model.entities.length === 1 ? "" : "s"}${model.categories.length ? `, grouped into ${model.categories.length} areas of the business` : ""}. Every screen in it &mdash; every list, every form, every field label and every dropdown &mdash; is drawn from a description of those records held in the application itself, so the application can be changed by changing that description rather than by editing code.</p>
    <p>This manual is generated from the same description. It cannot describe a record type the application does not have, and it cannot miss one it does.</p>
${model.categories.length ? `    <table>
      <thead><tr><th>Area</th><th>Records</th></tr></thead>
      <tbody>
${model.categories.map((category) => `        <tr><td>${escapeHtml(category.name)}${category.description ? `<div class="detail">${escapeHtml(category.description)}</div>` : ""}</td><td>${category.entities.map((name) => `<a href="#entity-${slug2(name)}">${escapeHtml(title(name))}</a>`).join(", ")}</td></tr>`).join(`
`)}
      </tbody>
    </table>` : ""}
    <p class="back"><a href="#top">Back to contents</a></p>
  </section>

  <section id="signing-in">
    <h2>Signing in, and what each role sees</h2>
    <p>The application is seeded with one account per role the model names, so each can be looked at as itself. The Administrator bypasses every restriction, which is what makes it the account to compare the others against.</p>
    <table>
      <thead><tr><th>Role</th><th>Account</th><th>Records it can see</th></tr></thead>
      <tbody>
${accountRows}
      </tbody>
    </table>
${options.adminPassword ? `    <p>Every seeded account uses the password <code>${escapeHtml(options.adminPassword)}</code>. It is demonstration data &mdash; change it before this application holds anything real.</p>` : ""}
    <p class="back"><a href="#top">Back to contents</a></p>
  </section>

  <section id="entities">
    <h2>The records it keeps</h2>
    <p>One section per record type. For each: what it is, every field it has and what that field is for, the records it connects to, the states it moves through, and who may use it.</p>

${entitySections}
  </section>

${rulesSection}

${processSection}

  <section id="how-it-was-built">
    <h2>How this application was built</h2>
    <p>It was generated from a single model file &mdash; a YAML document describing the records, the rules and the processes above. The generator read that file and wrote the database schema, the API, the screens and this manual from it.</p>
    <p>What it wrote is source you can read, edit and deploy: a Loco.rs API in Rust, a TanStack Start front end, and a <code>docker-compose.yml</code> that brings up PostgreSQL, the API and the web front end together.</p>
    <p>Regenerating from an amended model rewrites all of it, this manual included. Nothing here is maintained by hand, which is why it cannot fall out of step with the application it describes.</p>
    <p class="back"><a href="#top">Back to contents</a></p>
  </section>

  <footer>
    ${escapeHtml(options.name)} ${escapeHtml(options.version)} &middot; ${model.entities.length} record types &middot; ${model.rules.length} rules &middot; ${model.workflows.length + model.sagas.length} processes
  </footer>
</div>
</body>
</html>
`;
}

// node_modules/.bun/yaml@2.9.1/node_modules/yaml/browser/dist/nodes/identity.js
var ALIAS = Symbol.for("yaml.alias");
var DOC = Symbol.for("yaml.document");
var MAP = Symbol.for("yaml.map");
var PAIR = Symbol.for("yaml.pair");
var SCALAR = Symbol.for("yaml.scalar");
var SEQ = Symbol.for("yaml.seq");
var NODE_TYPE = Symbol.for("yaml.node.type");
var isAlias = (node) => !!node && typeof node === "object" && node[NODE_TYPE] === ALIAS;
var isDocument = (node) => !!node && typeof node === "object" && node[NODE_TYPE] === DOC;
var isMap = (node) => !!node && typeof node === "object" && node[NODE_TYPE] === MAP;
var isPair = (node) => !!node && typeof node === "object" && node[NODE_TYPE] === PAIR;
var isScalar = (node) => !!node && typeof node === "object" && node[NODE_TYPE] === SCALAR;
var isSeq = (node) => !!node && typeof node === "object" && node[NODE_TYPE] === SEQ;
function isCollection(node) {
  if (node && typeof node === "object")
    switch (node[NODE_TYPE]) {
      case MAP:
      case SEQ:
        return true;
    }
  return false;
}
function isNode(node) {
  if (node && typeof node === "object")
    switch (node[NODE_TYPE]) {
      case ALIAS:
      case MAP:
      case SCALAR:
      case SEQ:
        return true;
    }
  return false;
}
var hasAnchor = (node) => (isScalar(node) || isCollection(node)) && !!node.anchor;

// node_modules/.bun/yaml@2.9.1/node_modules/yaml/browser/dist/visit.js
var BREAK = Symbol("break visit");
var SKIP = Symbol("skip children");
var REMOVE = Symbol("remove node");
function visit(node, visitor) {
  const visitor_ = initVisitor(visitor);
  if (isDocument(node)) {
    const cd = visit_(null, node.contents, visitor_, Object.freeze([node]));
    if (cd === REMOVE)
      node.contents = null;
  } else
    visit_(null, node, visitor_, Object.freeze([]));
}
visit.BREAK = BREAK;
visit.SKIP = SKIP;
visit.REMOVE = REMOVE;
function visit_(key, node, visitor, path) {
  const ctrl = callVisitor(key, node, visitor, path);
  if (isNode(ctrl) || isPair(ctrl)) {
    replaceNode(key, path, ctrl);
    return visit_(key, ctrl, visitor, path);
  }
  if (typeof ctrl !== "symbol") {
    if (isCollection(node)) {
      path = Object.freeze(path.concat(node));
      for (let i = 0;i < node.items.length; ++i) {
        const ci = visit_(i, node.items[i], visitor, path);
        if (typeof ci === "number")
          i = ci - 1;
        else if (ci === BREAK)
          return BREAK;
        else if (ci === REMOVE) {
          node.items.splice(i, 1);
          i -= 1;
        }
      }
    } else if (isPair(node)) {
      path = Object.freeze(path.concat(node));
      const ck = visit_("key", node.key, visitor, path);
      if (ck === BREAK)
        return BREAK;
      else if (ck === REMOVE)
        node.key = null;
      const cv = visit_("value", node.value, visitor, path);
      if (cv === BREAK)
        return BREAK;
      else if (cv === REMOVE)
        node.value = null;
    }
  }
  return ctrl;
}
async function visitAsync(node, visitor) {
  const visitor_ = initVisitor(visitor);
  if (isDocument(node)) {
    const cd = await visitAsync_(null, node.contents, visitor_, Object.freeze([node]));
    if (cd === REMOVE)
      node.contents = null;
  } else
    await visitAsync_(null, node, visitor_, Object.freeze([]));
}
visitAsync.BREAK = BREAK;
visitAsync.SKIP = SKIP;
visitAsync.REMOVE = REMOVE;
async function visitAsync_(key, node, visitor, path) {
  const ctrl = await callVisitor(key, node, visitor, path);
  if (isNode(ctrl) || isPair(ctrl)) {
    replaceNode(key, path, ctrl);
    return visitAsync_(key, ctrl, visitor, path);
  }
  if (typeof ctrl !== "symbol") {
    if (isCollection(node)) {
      path = Object.freeze(path.concat(node));
      for (let i = 0;i < node.items.length; ++i) {
        const ci = await visitAsync_(i, node.items[i], visitor, path);
        if (typeof ci === "number")
          i = ci - 1;
        else if (ci === BREAK)
          return BREAK;
        else if (ci === REMOVE) {
          node.items.splice(i, 1);
          i -= 1;
        }
      }
    } else if (isPair(node)) {
      path = Object.freeze(path.concat(node));
      const ck = await visitAsync_("key", node.key, visitor, path);
      if (ck === BREAK)
        return BREAK;
      else if (ck === REMOVE)
        node.key = null;
      const cv = await visitAsync_("value", node.value, visitor, path);
      if (cv === BREAK)
        return BREAK;
      else if (cv === REMOVE)
        node.value = null;
    }
  }
  return ctrl;
}
function initVisitor(visitor) {
  if (typeof visitor === "object" && (visitor.Collection || visitor.Node || visitor.Value)) {
    return Object.assign({
      Alias: visitor.Node,
      Map: visitor.Node,
      Scalar: visitor.Node,
      Seq: visitor.Node
    }, visitor.Value && {
      Map: visitor.Value,
      Scalar: visitor.Value,
      Seq: visitor.Value
    }, visitor.Collection && {
      Map: visitor.Collection,
      Seq: visitor.Collection
    }, visitor);
  }
  return visitor;
}
function callVisitor(key, node, visitor, path) {
  if (typeof visitor === "function")
    return visitor(key, node, path);
  if (isMap(node))
    return visitor.Map?.(key, node, path);
  if (isSeq(node))
    return visitor.Seq?.(key, node, path);
  if (isPair(node))
    return visitor.Pair?.(key, node, path);
  if (isScalar(node))
    return visitor.Scalar?.(key, node, path);
  if (isAlias(node))
    return visitor.Alias?.(key, node, path);
  return;
}
function replaceNode(key, path, node) {
  const parent = path[path.length - 1];
  if (isCollection(parent)) {
    parent.items[key] = node;
  } else if (isPair(parent)) {
    if (key === "key")
      parent.key = node;
    else
      parent.value = node;
  } else if (isDocument(parent)) {
    parent.contents = node;
  } else {
    const pt = isAlias(parent) ? "alias" : "scalar";
    throw new Error(`Cannot replace node with ${pt} parent`);
  }
}

// node_modules/.bun/yaml@2.9.1/node_modules/yaml/browser/dist/doc/directives.js
var escapeChars = {
  "!": "%21",
  ",": "%2C",
  "[": "%5B",
  "]": "%5D",
  "{": "%7B",
  "}": "%7D"
};
var escapeTagName = (tn) => tn.replace(/[!,[\]{}]/g, (ch) => escapeChars[ch]);

class Directives {
  constructor(yaml, tags) {
    this.docStart = null;
    this.docEnd = false;
    this.yaml = Object.assign({}, Directives.defaultYaml, yaml);
    this.tags = Object.assign({}, Directives.defaultTags, tags);
  }
  clone() {
    const copy = new Directives(this.yaml, this.tags);
    copy.docStart = this.docStart;
    return copy;
  }
  atDocument() {
    const res = new Directives(this.yaml, this.tags);
    switch (this.yaml.version) {
      case "1.1":
        this.atNextDocument = true;
        break;
      case "1.2":
        this.atNextDocument = false;
        this.yaml = {
          explicit: Directives.defaultYaml.explicit,
          version: "1.2"
        };
        this.tags = Object.assign({}, Directives.defaultTags);
        break;
    }
    return res;
  }
  add(line, onError) {
    if (this.atNextDocument) {
      this.yaml = { explicit: Directives.defaultYaml.explicit, version: "1.1" };
      this.tags = Object.assign({}, Directives.defaultTags);
      this.atNextDocument = false;
    }
    const parts = line.trim().split(/[ \t]+/);
    const name = parts.shift();
    switch (name) {
      case "%TAG": {
        if (parts.length !== 2) {
          onError(0, "%TAG directive should contain exactly two parts");
          if (parts.length < 2)
            return false;
        }
        const [handle, prefix] = parts;
        this.tags[handle] = prefix;
        return true;
      }
      case "%YAML": {
        this.yaml.explicit = true;
        if (parts.length !== 1) {
          onError(0, "%YAML directive should contain exactly one part");
          return false;
        }
        const [version] = parts;
        if (version === "1.1" || version === "1.2") {
          this.yaml.version = version;
          return true;
        } else {
          const isValid = /^\d+\.\d+$/.test(version);
          onError(6, `Unsupported YAML version ${version}`, isValid);
          return false;
        }
      }
      default:
        onError(0, `Unknown directive ${name}`, true);
        return false;
    }
  }
  tagName(source, onError) {
    if (source === "!")
      return "!";
    if (source[0] !== "!") {
      onError(`Not a valid tag: ${source}`);
      return null;
    }
    if (source[1] === "<") {
      const verbatim = source.slice(2, -1);
      if (verbatim === "!" || verbatim === "!!") {
        onError(`Verbatim tags aren't resolved, so ${source} is invalid.`);
        return null;
      }
      if (source[source.length - 1] !== ">")
        onError("Verbatim tags must end with a >");
      return verbatim;
    }
    const [, handle, suffix] = source.match(/^(.*!)([^!]*)$/s);
    if (!suffix)
      onError(`The ${source} tag has no suffix`);
    const prefix = this.tags[handle];
    if (prefix) {
      try {
        return prefix + decodeURIComponent(suffix);
      } catch (error) {
        onError(String(error));
        return null;
      }
    }
    if (handle === "!")
      return source;
    onError(`Could not resolve tag: ${source}`);
    return null;
  }
  tagString(tag) {
    for (const [handle, prefix] of Object.entries(this.tags)) {
      if (tag.startsWith(prefix))
        return handle + escapeTagName(tag.substring(prefix.length));
    }
    return tag[0] === "!" ? tag : `!<${tag}>`;
  }
  toString(doc) {
    const lines = this.yaml.explicit ? [`%YAML ${this.yaml.version || "1.2"}`] : [];
    const tagEntries = Object.entries(this.tags);
    let tagNames;
    if (doc && tagEntries.length > 0 && isNode(doc.contents)) {
      const tags = {};
      visit(doc.contents, (_key, node) => {
        if (isNode(node) && node.tag)
          tags[node.tag] = true;
      });
      tagNames = Object.keys(tags);
    } else
      tagNames = [];
    for (const [handle, prefix] of tagEntries) {
      if (handle === "!!" && prefix === "tag:yaml.org,2002:")
        continue;
      if (!doc || tagNames.some((tn) => tn.startsWith(prefix)))
        lines.push(`%TAG ${handle} ${prefix}`);
    }
    return lines.join(`
`);
  }
}
Directives.defaultYaml = { explicit: false, version: "1.2" };
Directives.defaultTags = { "!!": "tag:yaml.org,2002:" };

// node_modules/.bun/yaml@2.9.1/node_modules/yaml/browser/dist/doc/anchors.js
function anchorIsValid(anchor) {
  if (/[\x00-\x19\s,[\]{}]/.test(anchor)) {
    const sa = JSON.stringify(anchor);
    const msg = `Anchor must not contain whitespace or control characters: ${sa}`;
    throw new Error(msg);
  }
  return true;
}
function anchorNames(root) {
  const anchors = new Set;
  visit(root, {
    Value(_key, node) {
      if (node.anchor)
        anchors.add(node.anchor);
    }
  });
  return anchors;
}
function findNewAnchor(prefix, exclude) {
  for (let i = 1;; ++i) {
    const name = `${prefix}${i}`;
    if (!exclude.has(name))
      return name;
  }
}
function createNodeAnchors(doc, prefix) {
  const aliasObjects = [];
  const sourceObjects = new Map;
  let prevAnchors = null;
  return {
    onAnchor: (source) => {
      aliasObjects.push(source);
      prevAnchors ?? (prevAnchors = anchorNames(doc));
      const anchor = findNewAnchor(prefix, prevAnchors);
      prevAnchors.add(anchor);
      return anchor;
    },
    setAnchors: () => {
      for (const source of aliasObjects) {
        const ref = sourceObjects.get(source);
        if (typeof ref === "object" && ref.anchor && (isScalar(ref.node) || isCollection(ref.node))) {
          ref.node.anchor = ref.anchor;
        } else {
          const error = new Error("Failed to resolve repeated object (this should not happen)");
          error.source = source;
          throw error;
        }
      }
    },
    sourceObjects
  };
}

// node_modules/.bun/yaml@2.9.1/node_modules/yaml/browser/dist/doc/applyReviver.js
function applyReviver(reviver, obj, key, val) {
  if (val && typeof val === "object") {
    if (Array.isArray(val)) {
      for (let i = 0, len = val.length;i < len; ++i) {
        const v0 = val[i];
        const v1 = applyReviver(reviver, val, String(i), v0);
        if (v1 === undefined)
          delete val[i];
        else if (v1 !== v0)
          val[i] = v1;
      }
    } else if (val instanceof Map) {
      for (const k of Array.from(val.keys())) {
        const v0 = val.get(k);
        const v1 = applyReviver(reviver, val, k, v0);
        if (v1 === undefined)
          val.delete(k);
        else if (v1 !== v0)
          val.set(k, v1);
      }
    } else if (val instanceof Set) {
      for (const v0 of Array.from(val)) {
        const v1 = applyReviver(reviver, val, v0, v0);
        if (v1 === undefined)
          val.delete(v0);
        else if (v1 !== v0) {
          val.delete(v0);
          val.add(v1);
        }
      }
    } else {
      for (const [k, v0] of Object.entries(val)) {
        const v1 = applyReviver(reviver, val, k, v0);
        if (v1 === undefined)
          delete val[k];
        else if (v1 !== v0)
          val[k] = v1;
      }
    }
  }
  return reviver.call(obj, key, val);
}

// node_modules/.bun/yaml@2.9.1/node_modules/yaml/browser/dist/nodes/toJS.js
function toJS(value, arg, ctx) {
  if (Array.isArray(value))
    return value.map((v, i) => toJS(v, String(i), ctx));
  if (value && typeof value.toJSON === "function") {
    if (!ctx || !hasAnchor(value))
      return value.toJSON(arg, ctx);
    const data = { aliasCount: 0, count: 1, res: undefined };
    ctx.anchors.set(value, data);
    ctx.onCreate = (res) => {
      data.res = res;
      delete ctx.onCreate;
    };
    const res = value.toJSON(arg, ctx);
    if (ctx.onCreate)
      ctx.onCreate(res);
    return res;
  }
  if (typeof value === "bigint" && !ctx?.keep)
    return Number(value);
  return value;
}

// node_modules/.bun/yaml@2.9.1/node_modules/yaml/browser/dist/nodes/Node.js
class NodeBase {
  constructor(type) {
    Object.defineProperty(this, NODE_TYPE, { value: type });
  }
  clone() {
    const copy = Object.create(Object.getPrototypeOf(this), Object.getOwnPropertyDescriptors(this));
    if (this.range)
      copy.range = this.range.slice();
    return copy;
  }
  toJS(doc, { mapAsMap, maxAliasCount, onAnchor, reviver } = {}) {
    if (!isDocument(doc))
      throw new TypeError("A document argument is required");
    const ctx = {
      anchors: new Map,
      doc,
      keep: true,
      mapAsMap: mapAsMap === true,
      mapKeyWarned: false,
      maxAliasCount: typeof maxAliasCount === "number" ? maxAliasCount : 100
    };
    const res = toJS(this, "", ctx);
    if (typeof onAnchor === "function")
      for (const { count, res } of ctx.anchors.values())
        onAnchor(res, count);
    return typeof reviver === "function" ? applyReviver(reviver, { "": res }, "", res) : res;
  }
}

// node_modules/.bun/yaml@2.9.1/node_modules/yaml/browser/dist/nodes/Alias.js
class Alias extends NodeBase {
  constructor(source) {
    super(ALIAS);
    this.source = source;
    Object.defineProperty(this, "tag", {
      set() {
        throw new Error("Alias nodes cannot have tags");
      }
    });
  }
  resolve(doc, ctx) {
    if (ctx?.maxAliasCount === 0)
      throw new ReferenceError("Alias resolution is disabled");
    let nodes;
    if (ctx?.aliasResolveCache) {
      nodes = ctx.aliasResolveCache;
    } else {
      nodes = [];
      visit(doc, {
        Node: (_key, node) => {
          if (isAlias(node) || hasAnchor(node))
            nodes.push(node);
        }
      });
      if (ctx)
        ctx.aliasResolveCache = nodes;
    }
    let found = undefined;
    for (const node of nodes) {
      if (node === this)
        break;
      if (node.anchor === this.source)
        found = node;
    }
    if (found && ctx) {
      const { anchors, doc, maxAliasCount } = ctx;
      let data = anchors.get(found);
      if (!data) {
        toJS(found, null, ctx);
        data = anchors.get(found);
      }
      if (data?.res === undefined) {
        const msg = "This should not happen: Alias anchor was not resolved?";
        throw new ReferenceError(msg);
      }
      if (maxAliasCount >= 0) {
        data.count += 1;
        if (data.aliasCount === 0)
          data.aliasCount = getAliasCount(doc, found, anchors);
        if (data.count * data.aliasCount > maxAliasCount) {
          const msg = "Excessive alias count indicates a resource exhaustion attack";
          throw new ReferenceError(msg);
        }
      }
    }
    return found;
  }
  toJSON(_arg, ctx) {
    if (!ctx)
      return { source: this.source };
    const source = this.resolve(ctx.doc, ctx);
    if (!source) {
      const msg = `Unresolved alias (the anchor must be set before the alias): ${this.source}`;
      throw new ReferenceError(msg);
    }
    return ctx.anchors.get(source).res;
  }
  toString(ctx, _onComment, _onChompKeep) {
    const src = `*${this.source}`;
    if (ctx) {
      anchorIsValid(this.source);
      if (ctx.options.verifyAliasOrder && !ctx.anchors.has(this.source)) {
        const msg = `Unresolved alias (the anchor must be set before the alias): ${this.source}`;
        throw new Error(msg);
      }
      if (ctx.implicitKey)
        return `${src} `;
    }
    return src;
  }
}
function getAliasCount(doc, node, anchors) {
  if (isAlias(node)) {
    const source = node.resolve(doc);
    const anchor = anchors && source && anchors.get(source);
    return anchor ? anchor.count * anchor.aliasCount : 0;
  } else if (isCollection(node)) {
    let count = 0;
    for (const item of node.items) {
      const c = getAliasCount(doc, item, anchors);
      if (c > count)
        count = c;
    }
    return count;
  } else if (isPair(node)) {
    const kc = getAliasCount(doc, node.key, anchors);
    const vc = getAliasCount(doc, node.value, anchors);
    return Math.max(kc, vc);
  }
  return 1;
}

// node_modules/.bun/yaml@2.9.1/node_modules/yaml/browser/dist/nodes/Scalar.js
var isScalarValue = (value) => !value || typeof value !== "function" && typeof value !== "object";

class Scalar extends NodeBase {
  constructor(value) {
    super(SCALAR);
    this.value = value;
  }
  toJSON(arg, ctx) {
    return ctx?.keep ? this.value : toJS(this.value, arg, ctx);
  }
  toString() {
    return String(this.value);
  }
}
Scalar.BLOCK_FOLDED = "BLOCK_FOLDED";
Scalar.BLOCK_LITERAL = "BLOCK_LITERAL";
Scalar.PLAIN = "PLAIN";
Scalar.QUOTE_DOUBLE = "QUOTE_DOUBLE";
Scalar.QUOTE_SINGLE = "QUOTE_SINGLE";

// node_modules/.bun/yaml@2.9.1/node_modules/yaml/browser/dist/doc/createNode.js
var defaultTagPrefix = "tag:yaml.org,2002:";
function findTagObject(value, tagName, tags) {
  if (tagName) {
    const match = tags.filter((t) => t.tag === tagName);
    const tagObj = match.find((t) => !t.format) ?? match[0];
    if (!tagObj)
      throw new Error(`Tag ${tagName} not found`);
    return tagObj;
  }
  return tags.find((t) => t.identify?.(value) && !t.format);
}
function createNode(value, tagName, ctx) {
  if (isDocument(value))
    value = value.contents;
  if (isNode(value))
    return value;
  if (isPair(value)) {
    const map = ctx.schema[MAP].createNode?.(ctx.schema, null, ctx);
    map.items.push(value);
    return map;
  }
  if (value instanceof String || value instanceof Number || value instanceof Boolean || typeof BigInt !== "undefined" && value instanceof BigInt) {
    value = value.valueOf();
  }
  const { aliasDuplicateObjects, onAnchor, onTagObj, schema, sourceObjects } = ctx;
  let ref = undefined;
  if (aliasDuplicateObjects && value && typeof value === "object") {
    ref = sourceObjects.get(value);
    if (ref) {
      ref.anchor ?? (ref.anchor = onAnchor(value));
      return new Alias(ref.anchor);
    } else {
      ref = { anchor: null, node: null };
      sourceObjects.set(value, ref);
    }
  }
  if (tagName?.startsWith("!!"))
    tagName = defaultTagPrefix + tagName.slice(2);
  let tagObj = findTagObject(value, tagName, schema.tags);
  if (!tagObj) {
    if (value && typeof value.toJSON === "function") {
      value = value.toJSON();
    }
    if (!value || typeof value !== "object") {
      const node = new Scalar(value);
      if (ref)
        ref.node = node;
      return node;
    }
    tagObj = value instanceof Map ? schema[MAP] : (Symbol.iterator in Object(value)) ? schema[SEQ] : schema[MAP];
  }
  if (onTagObj) {
    onTagObj(tagObj);
    delete ctx.onTagObj;
  }
  const node = tagObj?.createNode ? tagObj.createNode(ctx.schema, value, ctx) : typeof tagObj?.nodeClass?.from === "function" ? tagObj.nodeClass.from(ctx.schema, value, ctx) : new Scalar(value);
  if (tagName)
    node.tag = tagName;
  else if (!tagObj.default)
    node.tag = tagObj.tag;
  if (ref)
    ref.node = node;
  return node;
}

// node_modules/.bun/yaml@2.9.1/node_modules/yaml/browser/dist/nodes/Collection.js
function collectionFromPath(schema, path, value) {
  let v = value;
  for (let i = path.length - 1;i >= 0; --i) {
    const k = path[i];
    if (typeof k === "number" && Number.isInteger(k) && k >= 0) {
      const a = [];
      a[k] = v;
      v = a;
    } else {
      v = new Map([[k, v]]);
    }
  }
  return createNode(v, undefined, {
    aliasDuplicateObjects: false,
    keepUndefined: false,
    onAnchor: () => {
      throw new Error("This should not happen, please report a bug.");
    },
    schema,
    sourceObjects: new Map
  });
}
var isEmptyPath = (path) => path == null || typeof path === "object" && !!path[Symbol.iterator]().next().done;

class Collection extends NodeBase {
  constructor(type, schema) {
    super(type);
    Object.defineProperty(this, "schema", {
      value: schema,
      configurable: true,
      enumerable: false,
      writable: true
    });
  }
  clone(schema) {
    const copy = Object.create(Object.getPrototypeOf(this), Object.getOwnPropertyDescriptors(this));
    if (schema)
      copy.schema = schema;
    copy.items = copy.items.map((it) => isNode(it) || isPair(it) ? it.clone(schema) : it);
    if (this.range)
      copy.range = this.range.slice();
    return copy;
  }
  addIn(path, value) {
    if (isEmptyPath(path))
      this.add(value);
    else {
      const [key, ...rest] = path;
      const node = this.get(key, true);
      if (isCollection(node))
        node.addIn(rest, value);
      else if (node === undefined && this.schema)
        this.set(key, collectionFromPath(this.schema, rest, value));
      else
        throw new Error(`Expected YAML collection at ${key}. Remaining path: ${rest}`);
    }
  }
  deleteIn(path) {
    const [key, ...rest] = path;
    if (rest.length === 0)
      return this.delete(key);
    const node = this.get(key, true);
    if (isCollection(node))
      return node.deleteIn(rest);
    else
      throw new Error(`Expected YAML collection at ${key}. Remaining path: ${rest}`);
  }
  getIn(path, keepScalar) {
    const [key, ...rest] = path;
    const node = this.get(key, true);
    if (rest.length === 0)
      return !keepScalar && isScalar(node) ? node.value : node;
    else
      return isCollection(node) ? node.getIn(rest, keepScalar) : undefined;
  }
  hasAllNullValues(allowScalar) {
    return this.items.every((node) => {
      if (!isPair(node))
        return false;
      const n = node.value;
      return n == null || allowScalar && isScalar(n) && n.value == null && !n.commentBefore && !n.comment && !n.tag;
    });
  }
  hasIn(path) {
    const [key, ...rest] = path;
    if (rest.length === 0)
      return this.has(key);
    const node = this.get(key, true);
    return isCollection(node) ? node.hasIn(rest) : false;
  }
  setIn(path, value) {
    const [key, ...rest] = path;
    if (rest.length === 0) {
      this.set(key, value);
    } else {
      const node = this.get(key, true);
      if (isCollection(node))
        node.setIn(rest, value);
      else if (node === undefined && this.schema)
        this.set(key, collectionFromPath(this.schema, rest, value));
      else
        throw new Error(`Expected YAML collection at ${key}. Remaining path: ${rest}`);
    }
  }
}

// node_modules/.bun/yaml@2.9.1/node_modules/yaml/browser/dist/stringify/stringifyComment.js
var stringifyComment = (str) => str.replace(/^(?!$)(?: $)?/gm, "#");
function indentComment(comment, indent) {
  if (/^\n+$/.test(comment))
    return comment.substring(1);
  return indent ? comment.replace(/^(?! *$)/gm, indent) : comment;
}
var lineComment = (str, indent, comment) => str.endsWith(`
`) ? indentComment(comment, indent) : comment.includes(`
`) ? `
` + indentComment(comment, indent) : (str.endsWith(" ") ? "" : " ") + comment;

// node_modules/.bun/yaml@2.9.1/node_modules/yaml/browser/dist/stringify/foldFlowLines.js
var FOLD_FLOW = "flow";
var FOLD_BLOCK = "block";
var FOLD_QUOTED = "quoted";
function foldFlowLines(text, indent, mode = "flow", { indentAtStart, lineWidth = 80, minContentWidth = 20, onFold, onOverflow } = {}) {
  if (!lineWidth || lineWidth < 0)
    return text;
  if (lineWidth < minContentWidth)
    minContentWidth = 0;
  const endStep = Math.max(1 + minContentWidth, 1 + lineWidth - indent.length);
  if (text.length <= endStep)
    return text;
  const folds = [];
  const escapedFolds = {};
  let end = lineWidth - indent.length;
  if (typeof indentAtStart === "number") {
    if (indentAtStart > lineWidth - Math.max(2, minContentWidth))
      folds.push(0);
    else
      end = lineWidth - indentAtStart;
  }
  let split = undefined;
  let prev = undefined;
  let overflow = false;
  let i = -1;
  let escStart = -1;
  let escEnd = -1;
  if (mode === FOLD_BLOCK) {
    i = consumeMoreIndentedLines(text, i, indent.length);
    if (i !== -1)
      end = i + endStep;
  }
  for (let ch;ch = text[i += 1]; ) {
    if (mode === FOLD_QUOTED && ch === "\\") {
      escStart = i;
      switch (text[i + 1]) {
        case "x":
          i += 3;
          break;
        case "u":
          i += 5;
          break;
        case "U":
          i += 9;
          break;
        default:
          i += 1;
      }
      escEnd = i;
    }
    if (ch === `
`) {
      if (mode === FOLD_BLOCK)
        i = consumeMoreIndentedLines(text, i, indent.length);
      end = i + indent.length + endStep;
      split = undefined;
    } else {
      if (ch === " " && prev && prev !== " " && prev !== `
` && prev !== "\t") {
        const next = text[i + 1];
        if (next && next !== " " && next !== `
` && next !== "\t")
          split = i;
      }
      if (i >= end) {
        if (split) {
          folds.push(split);
          end = split + endStep;
          split = undefined;
        } else if (mode === FOLD_QUOTED) {
          while (prev === " " || prev === "\t") {
            prev = ch;
            ch = text[i += 1];
            overflow = true;
          }
          const j = i > escEnd + 1 ? i - 2 : escStart - 1;
          if (escapedFolds[j])
            return text;
          folds.push(j);
          escapedFolds[j] = true;
          end = j + endStep;
          split = undefined;
        } else {
          overflow = true;
        }
      }
    }
    prev = ch;
  }
  if (overflow && onOverflow)
    onOverflow();
  if (folds.length === 0)
    return text;
  if (onFold)
    onFold();
  let res = text.slice(0, folds[0]);
  for (let i = 0;i < folds.length; ++i) {
    const fold = folds[i];
    const end = folds[i + 1] || text.length;
    if (fold === 0)
      res = `
${indent}${text.slice(0, end)}`;
    else {
      if (mode === FOLD_QUOTED && escapedFolds[fold])
        res += `${text[fold]}\\`;
      res += `
${indent}${text.slice(fold + 1, end)}`;
    }
  }
  return res;
}
function consumeMoreIndentedLines(text, i, indent) {
  let end = i;
  let start = i + 1;
  let ch = text[start];
  while (ch === " " || ch === "\t") {
    if (i < start + indent) {
      ch = text[++i];
    } else {
      do {
        ch = text[++i];
      } while (ch && ch !== `
`);
      end = i;
      start = i + 1;
      ch = text[start];
    }
  }
  return end;
}

// node_modules/.bun/yaml@2.9.1/node_modules/yaml/browser/dist/stringify/stringifyString.js
var getFoldOptions = (ctx, isBlock) => ({
  indentAtStart: isBlock ? ctx.indent.length : ctx.indentAtStart,
  lineWidth: ctx.options.lineWidth,
  minContentWidth: ctx.options.minContentWidth
});
var containsDocumentMarker = (str) => /^(%|---|\.\.\.)/m.test(str);
function lineLengthOverLimit(str, lineWidth, indentLength) {
  if (!lineWidth || lineWidth < 0)
    return false;
  const limit = lineWidth - indentLength;
  const strLen = str.length;
  if (strLen <= limit)
    return false;
  for (let i = 0, start = 0;i < strLen; ++i) {
    if (str[i] === `
`) {
      if (i - start > limit)
        return true;
      start = i + 1;
      if (strLen - start <= limit)
        return false;
    }
  }
  return true;
}
function doubleQuotedString(value, ctx) {
  const json = JSON.stringify(value);
  if (ctx.options.doubleQuotedAsJSON)
    return json;
  const { implicitKey } = ctx;
  const minMultiLineLength = ctx.options.doubleQuotedMinMultiLineLength;
  const indent = ctx.indent || (containsDocumentMarker(value) ? "  " : "");
  let str = "";
  let start = 0;
  for (let i = 0, ch = json[i];ch; ch = json[++i]) {
    if (ch === " " && json[i + 1] === "\\" && json[i + 2] === "n") {
      str += json.slice(start, i) + "\\ ";
      i += 1;
      start = i;
      ch = "\\";
    }
    if (ch === "\\")
      switch (json[i + 1]) {
        case "u":
          {
            str += json.slice(start, i);
            const code = json.substr(i + 2, 4);
            switch (code) {
              case "0000":
                str += "\\0";
                break;
              case "0007":
                str += "\\a";
                break;
              case "000b":
                str += "\\v";
                break;
              case "001b":
                str += "\\e";
                break;
              case "0085":
                str += "\\N";
                break;
              case "00a0":
                str += "\\_";
                break;
              case "2028":
                str += "\\L";
                break;
              case "2029":
                str += "\\P";
                break;
              default:
                if (code.substr(0, 2) === "00")
                  str += "\\x" + code.substr(2);
                else
                  str += json.substr(i, 6);
            }
            i += 5;
            start = i + 1;
          }
          break;
        case "n":
          if (implicitKey || json[i + 2] === '"' || json.length < minMultiLineLength) {
            i += 1;
          } else {
            str += json.slice(start, i) + `

`;
            while (json[i + 2] === "\\" && json[i + 3] === "n" && json[i + 4] !== '"') {
              str += `
`;
              i += 2;
            }
            str += indent;
            if (json[i + 2] === " ")
              str += "\\";
            i += 1;
            start = i + 1;
          }
          break;
        default:
          i += 1;
      }
  }
  str = start ? str + json.slice(start) : json;
  return implicitKey ? str : foldFlowLines(str, indent, FOLD_QUOTED, getFoldOptions(ctx, false));
}
function singleQuotedString(value, ctx) {
  if (ctx.options.singleQuote === false || ctx.implicitKey && value.includes(`
`) || /[ \t]\n|\n[ \t]/.test(value))
    return doubleQuotedString(value, ctx);
  const indent = ctx.indent || (containsDocumentMarker(value) ? "  " : "");
  const res = "'" + value.replace(/'/g, "''").replace(/\n+/g, `$&
${indent}`) + "'";
  return ctx.implicitKey ? res : foldFlowLines(res, indent, FOLD_FLOW, getFoldOptions(ctx, false));
}
function quotedString(value, ctx) {
  const { singleQuote } = ctx.options;
  let qs;
  if (singleQuote === false)
    qs = doubleQuotedString;
  else {
    const hasDouble = value.includes('"');
    const hasSingle = value.includes("'");
    if (hasDouble && !hasSingle)
      qs = singleQuotedString;
    else if (hasSingle && !hasDouble)
      qs = doubleQuotedString;
    else
      qs = singleQuote ? singleQuotedString : doubleQuotedString;
  }
  return qs(value, ctx);
}
var blockEndNewlines;
try {
  blockEndNewlines = new RegExp(`(^|(?<!
))
+(?!
|$)`, "g");
} catch {
  blockEndNewlines = /\n+(?!\n|$)/g;
}
function blockString({ comment, type, value }, ctx, onComment, onChompKeep) {
  const { blockQuote, commentString, lineWidth } = ctx.options;
  if (!blockQuote || /\n[\t ]+$/.test(value)) {
    return quotedString(value, ctx);
  }
  const indent = ctx.indent || (ctx.forceBlockIndent || containsDocumentMarker(value) ? "  " : "");
  const literal = blockQuote === "literal" ? true : blockQuote === "folded" || type === Scalar.BLOCK_FOLDED ? false : type === Scalar.BLOCK_LITERAL ? true : !lineLengthOverLimit(value, lineWidth, indent.length);
  if (!value)
    return literal ? `|
` : `>
`;
  let chomp;
  let endStart;
  for (endStart = value.length;endStart > 0; --endStart) {
    const ch = value[endStart - 1];
    if (ch !== `
` && ch !== "\t" && ch !== " ")
      break;
  }
  let end = value.substring(endStart);
  const endNlPos = end.indexOf(`
`);
  if (endNlPos === -1) {
    chomp = "-";
  } else if (value === end || endNlPos !== end.length - 1) {
    chomp = "+";
    if (onChompKeep)
      onChompKeep();
  } else {
    chomp = "";
  }
  if (end) {
    value = value.slice(0, -end.length);
    if (end[end.length - 1] === `
`)
      end = end.slice(0, -1);
    end = end.replace(blockEndNewlines, `$&${indent}`);
  }
  let startWithSpace = false;
  let startEnd;
  let startNlPos = -1;
  for (startEnd = 0;startEnd < value.length; ++startEnd) {
    const ch = value[startEnd];
    if (ch === " ")
      startWithSpace = true;
    else if (ch === `
`)
      startNlPos = startEnd;
    else
      break;
  }
  let start = value.substring(0, startNlPos < startEnd ? startNlPos + 1 : startEnd);
  if (start) {
    value = value.substring(start.length);
    start = start.replace(/\n+/g, `$&${indent}`);
  }
  const indentSize = indent ? "2" : "1";
  let header = (startWithSpace ? indentSize : "") + chomp;
  if (comment) {
    header += " " + commentString(comment.replace(/ ?[\r\n]+/g, " "));
    if (onComment)
      onComment();
  }
  if (!literal) {
    const foldedValue = value.replace(/\n+/g, `
$&`).replace(/(?:^|\n)([\t ].*)(?:([\n\t ]*)\n(?![\n\t ]))?/g, "$1$2").replace(/\n+/g, `$&${indent}`);
    let literalFallback = false;
    const foldOptions = getFoldOptions(ctx, true);
    if (blockQuote !== "folded" && type !== Scalar.BLOCK_FOLDED) {
      foldOptions.onOverflow = () => {
        literalFallback = true;
      };
    }
    const body = foldFlowLines(`${start}${foldedValue}${end}`, indent, FOLD_BLOCK, foldOptions);
    if (!literalFallback)
      return `>${header}
${indent}${body}`;
  }
  value = value.replace(/\n+/g, `$&${indent}`);
  return `|${header}
${indent}${start}${value}${end}`;
}
function plainString(item, ctx, onComment, onChompKeep) {
  const { type, value } = item;
  const { actualString, implicitKey, indent, indentStep, inFlow } = ctx;
  if (implicitKey && value.includes(`
`) || inFlow && /[[\]{},]/.test(value)) {
    return quotedString(value, ctx);
  }
  if (/^[\n\t ,[\]{}#&*!|>'"%@`]|^[?-]$|^[?-][ \t]|[\n:][ \t]|[ \t]\n|[\n\t ]#|[\n\t :]$/.test(value)) {
    return implicitKey || inFlow || !value.includes(`
`) ? quotedString(value, ctx) : blockString(item, ctx, onComment, onChompKeep);
  }
  if (!implicitKey && !inFlow && type !== Scalar.PLAIN && value.includes(`
`)) {
    return blockString(item, ctx, onComment, onChompKeep);
  }
  if (containsDocumentMarker(value)) {
    if (indent === "") {
      ctx.forceBlockIndent = true;
      return blockString(item, ctx, onComment, onChompKeep);
    } else if (implicitKey && indent === indentStep) {
      return quotedString(value, ctx);
    }
  }
  const str = value.replace(/\n+/g, `$&
${indent}`);
  if (actualString) {
    const test = (tag) => tag.default && tag.tag !== "tag:yaml.org,2002:str" && tag.test?.test(str);
    const { compat, tags } = ctx.doc.schema;
    if (tags.some(test) || compat?.some(test))
      return quotedString(value, ctx);
  }
  return implicitKey ? str : foldFlowLines(str, indent, FOLD_FLOW, getFoldOptions(ctx, false));
}
function stringifyString(item, ctx, onComment, onChompKeep) {
  const { implicitKey, inFlow } = ctx;
  const ss = typeof item.value === "string" ? item : Object.assign({}, item, { value: String(item.value) });
  let { type } = item;
  if (type !== Scalar.QUOTE_DOUBLE) {
    if (/[\x00-\x08\x0b-\x1f\x7f-\x9f\u{D800}-\u{DFFF}]/u.test(ss.value))
      type = Scalar.QUOTE_DOUBLE;
  }
  const _stringify = (_type) => {
    switch (_type) {
      case Scalar.BLOCK_FOLDED:
      case Scalar.BLOCK_LITERAL:
        return implicitKey || inFlow ? quotedString(ss.value, ctx) : blockString(ss, ctx, onComment, onChompKeep);
      case Scalar.QUOTE_DOUBLE:
        return doubleQuotedString(ss.value, ctx);
      case Scalar.QUOTE_SINGLE:
        return singleQuotedString(ss.value, ctx);
      case Scalar.PLAIN:
        return plainString(ss, ctx, onComment, onChompKeep);
      default:
        return null;
    }
  };
  let res = _stringify(type);
  if (res === null) {
    const { defaultKeyType, defaultStringType } = ctx.options;
    const t = implicitKey && defaultKeyType || defaultStringType;
    res = _stringify(t);
    if (res === null)
      throw new Error(`Unsupported default string type ${t}`);
  }
  return res;
}

// node_modules/.bun/yaml@2.9.1/node_modules/yaml/browser/dist/stringify/stringify.js
function createStringifyContext(doc, options) {
  const opt = Object.assign({
    blockQuote: true,
    commentString: stringifyComment,
    defaultKeyType: null,
    defaultStringType: "PLAIN",
    directives: null,
    doubleQuotedAsJSON: false,
    doubleQuotedMinMultiLineLength: 40,
    falseStr: "false",
    flowCollectionPadding: true,
    indentSeq: true,
    lineWidth: 80,
    minContentWidth: 20,
    nullStr: "null",
    simpleKeys: false,
    singleQuote: null,
    trailingComma: false,
    trueStr: "true",
    verifyAliasOrder: true
  }, doc.schema.toStringOptions, options);
  let inFlow;
  switch (opt.collectionStyle) {
    case "block":
      inFlow = false;
      break;
    case "flow":
      inFlow = true;
      break;
    default:
      inFlow = null;
  }
  return {
    anchors: new Set,
    doc,
    flowCollectionPadding: opt.flowCollectionPadding ? " " : "",
    indent: "",
    indentStep: typeof opt.indent === "number" ? " ".repeat(opt.indent) : "  ",
    inFlow,
    options: opt
  };
}
function getTagObject(tags, item) {
  if (item.tag) {
    const match = tags.filter((t) => t.tag === item.tag);
    if (match.length > 0)
      return match.find((t) => t.format === item.format) ?? match[0];
  }
  let tagObj = undefined;
  let obj;
  if (isScalar(item)) {
    obj = item.value;
    let match = tags.filter((t) => t.identify?.(obj));
    if (match.length > 1) {
      const testMatch = match.filter((t) => t.test);
      if (testMatch.length > 0)
        match = testMatch;
    }
    tagObj = match.find((t) => t.format === item.format) ?? match.find((t) => !t.format);
  } else {
    obj = item;
    tagObj = tags.find((t) => t.nodeClass && obj instanceof t.nodeClass);
  }
  if (!tagObj) {
    const name = obj?.constructor?.name ?? (obj === null ? "null" : typeof obj);
    throw new Error(`Tag not resolved for ${name} value`);
  }
  return tagObj;
}
function stringifyProps(node, tagObj, { anchors, doc }) {
  if (!doc.directives)
    return "";
  const props = [];
  const anchor = (isScalar(node) || isCollection(node)) && node.anchor;
  if (anchor && anchorIsValid(anchor)) {
    anchors.add(anchor);
    props.push(`&${anchor}`);
  }
  const tag = node.tag ?? (tagObj.default ? null : tagObj.tag);
  if (tag)
    props.push(doc.directives.tagString(tag));
  return props.join(" ");
}
function stringify(item, ctx, onComment, onChompKeep) {
  if (isPair(item))
    return item.toString(ctx, onComment, onChompKeep);
  if (isAlias(item)) {
    if (ctx.doc.directives)
      return item.toString(ctx);
    if (ctx.resolvedAliases?.has(item)) {
      throw new TypeError(`Cannot stringify circular structure without alias nodes`);
    } else {
      if (ctx.resolvedAliases)
        ctx.resolvedAliases.add(item);
      else
        ctx.resolvedAliases = new Set([item]);
      item = item.resolve(ctx.doc);
    }
  }
  let tagObj = undefined;
  const node = isNode(item) ? item : ctx.doc.createNode(item, { onTagObj: (o) => tagObj = o });
  tagObj ?? (tagObj = getTagObject(ctx.doc.schema.tags, node));
  const props = stringifyProps(node, tagObj, ctx);
  if (props.length > 0)
    ctx.indentAtStart = (ctx.indentAtStart ?? 0) + props.length + 1;
  const str = typeof tagObj.stringify === "function" ? tagObj.stringify(node, ctx, onComment, onChompKeep) : isScalar(node) ? stringifyString(node, ctx, onComment, onChompKeep) : node.toString(ctx, onComment, onChompKeep);
  if (!props)
    return str;
  return isScalar(node) || str[0] === "{" || str[0] === "[" ? `${props} ${str}` : `${props}
${ctx.indent}${str}`;
}

// node_modules/.bun/yaml@2.9.1/node_modules/yaml/browser/dist/stringify/stringifyPair.js
function stringifyPair({ key, value }, ctx, onComment, onChompKeep) {
  const { allNullValues, doc, indent, indentStep, options: { commentString, indentSeq, simpleKeys } } = ctx;
  let keyComment = isNode(key) && key.comment || null;
  if (simpleKeys) {
    if (keyComment) {
      throw new Error("With simple keys, key nodes cannot have comments");
    }
    if (isCollection(key) || !isNode(key) && typeof key === "object") {
      const msg = "With simple keys, collection cannot be used as a key value";
      throw new Error(msg);
    }
  }
  let explicitKey = !simpleKeys && (!key || keyComment && value == null && !ctx.inFlow || isCollection(key) || (isScalar(key) ? key.type === Scalar.BLOCK_FOLDED || key.type === Scalar.BLOCK_LITERAL : typeof key === "object"));
  ctx = Object.assign({}, ctx, {
    allNullValues: false,
    implicitKey: !explicitKey && (simpleKeys || !allNullValues),
    indent: indent + indentStep
  });
  let keyCommentDone = false;
  let chompKeep = false;
  let str = stringify(key, ctx, () => keyCommentDone = true, () => chompKeep = true);
  if (!explicitKey && !ctx.inFlow && str.length > 1024) {
    if (simpleKeys)
      throw new Error("With simple keys, single line scalar must not span more than 1024 characters");
    explicitKey = true;
  }
  if (ctx.inFlow) {
    if (allNullValues || value == null) {
      if (keyCommentDone && onComment)
        onComment();
      return str === "" ? "?" : explicitKey ? `? ${str}` : str;
    }
  } else if (allNullValues && !simpleKeys || value == null && explicitKey) {
    str = `? ${str}`;
    if (keyComment && !keyCommentDone) {
      str += lineComment(str, ctx.indent, commentString(keyComment));
    } else if (chompKeep && onChompKeep)
      onChompKeep();
    return str;
  }
  if (keyCommentDone)
    keyComment = null;
  if (explicitKey) {
    if (keyComment)
      str += lineComment(str, ctx.indent, commentString(keyComment));
    str = `? ${str}
${indent}:`;
  } else {
    str = `${str}:`;
    if (keyComment)
      str += lineComment(str, ctx.indent, commentString(keyComment));
  }
  let vsb, vcb, valueComment;
  if (isNode(value)) {
    vsb = !!value.spaceBefore;
    vcb = value.commentBefore;
    valueComment = value.comment;
  } else {
    vsb = false;
    vcb = null;
    valueComment = null;
    if (value && typeof value === "object")
      value = doc.createNode(value);
  }
  ctx.implicitKey = false;
  if (!explicitKey && !keyComment && isScalar(value))
    ctx.indentAtStart = str.length + 1;
  chompKeep = false;
  if (!indentSeq && indentStep.length >= 2 && !ctx.inFlow && !explicitKey && isSeq(value) && !value.flow && !value.tag && !value.anchor) {
    ctx.indent = ctx.indent.substring(2);
  }
  let valueCommentDone = false;
  const valueStr = stringify(value, ctx, () => valueCommentDone = true, () => chompKeep = true);
  let ws = " ";
  if (keyComment || vsb || vcb) {
    ws = vsb ? `
` : "";
    if (vcb) {
      const cs = commentString(vcb);
      ws += `
${indentComment(cs, ctx.indent)}`;
    }
    if (valueStr === "" && !ctx.inFlow) {
      if (ws === `
` && valueComment)
        ws = `

`;
    } else {
      ws += `
${ctx.indent}`;
    }
  } else if (!explicitKey && isCollection(value)) {
    const vs0 = valueStr[0];
    const nl0 = valueStr.indexOf(`
`);
    const hasNewline = nl0 !== -1;
    const flow = ctx.inFlow ?? value.flow ?? value.items.length === 0;
    if (hasNewline || !flow) {
      let hasPropsLine = false;
      if (hasNewline && (vs0 === "&" || vs0 === "!")) {
        let sp0 = valueStr.indexOf(" ");
        if (vs0 === "&" && sp0 !== -1 && sp0 < nl0 && valueStr[sp0 + 1] === "!") {
          sp0 = valueStr.indexOf(" ", sp0 + 1);
        }
        if (sp0 === -1 || nl0 < sp0)
          hasPropsLine = true;
      }
      if (!hasPropsLine)
        ws = `
${ctx.indent}`;
    }
  } else if (valueStr === "" || valueStr[0] === `
`) {
    ws = "";
  }
  str += ws + valueStr;
  if (ctx.inFlow) {
    if (valueCommentDone && onComment)
      onComment();
  } else if (valueComment && !valueCommentDone) {
    str += lineComment(str, ctx.indent, commentString(valueComment));
  } else if (chompKeep && onChompKeep) {
    onChompKeep();
  }
  return str;
}

// node_modules/.bun/yaml@2.9.1/node_modules/yaml/browser/dist/log.js
function warn(logLevel, warning) {
  if (logLevel === "debug" || logLevel === "warn") {
    console.warn(warning);
  }
}

// node_modules/.bun/yaml@2.9.1/node_modules/yaml/browser/dist/schema/yaml-1.1/merge.js
var MERGE_KEY = "<<";
var merge = {
  identify: (value) => value === MERGE_KEY || typeof value === "symbol" && value.description === MERGE_KEY,
  default: "key",
  tag: "tag:yaml.org,2002:merge",
  test: /^<<$/,
  resolve: () => Object.assign(new Scalar(Symbol(MERGE_KEY)), {
    addToJSMap: addMergeToJSMap
  }),
  stringify: () => MERGE_KEY
};
var isMergeKey = (ctx, key) => (merge.identify(key) || isScalar(key) && (!key.type || key.type === Scalar.PLAIN) && merge.identify(key.value)) && ctx?.doc.schema.tags.some((tag) => tag.tag === merge.tag && tag.default);
function addMergeToJSMap(ctx, map, value) {
  const source = resolveAliasValue(ctx, value);
  if (isSeq(source))
    for (const it of source.items)
      mergeValue(ctx, map, it);
  else if (Array.isArray(source))
    for (const it of source)
      mergeValue(ctx, map, it);
  else
    mergeValue(ctx, map, source);
}
function mergeValue(ctx, map, value) {
  const source = resolveAliasValue(ctx, value);
  if (!isMap(source))
    throw new Error("Merge sources must be maps or map aliases");
  const srcMap = source.toJSON(null, ctx, Map);
  for (const [key, value] of srcMap) {
    if (map instanceof Map) {
      if (!map.has(key))
        map.set(key, value);
    } else if (map instanceof Set) {
      map.add(key);
    } else if (!Object.prototype.hasOwnProperty.call(map, key)) {
      Object.defineProperty(map, key, {
        value,
        writable: true,
        enumerable: true,
        configurable: true
      });
    }
  }
  return map;
}
function resolveAliasValue(ctx, value) {
  return ctx && isAlias(value) ? value.resolve(ctx.doc, ctx) : value;
}

// node_modules/.bun/yaml@2.9.1/node_modules/yaml/browser/dist/nodes/addPairToJSMap.js
function addPairToJSMap(ctx, map, { key, value }) {
  if (isNode(key) && key.addToJSMap)
    key.addToJSMap(ctx, map, value);
  else if (isMergeKey(ctx, key))
    addMergeToJSMap(ctx, map, value);
  else {
    const jsKey = toJS(key, "", ctx);
    if (map instanceof Map) {
      map.set(jsKey, toJS(value, jsKey, ctx));
    } else if (map instanceof Set) {
      map.add(jsKey);
    } else {
      const stringKey = stringifyKey(key, jsKey, ctx);
      const jsValue = toJS(value, stringKey, ctx);
      if (stringKey in map)
        Object.defineProperty(map, stringKey, {
          value: jsValue,
          writable: true,
          enumerable: true,
          configurable: true
        });
      else
        map[stringKey] = jsValue;
    }
  }
  return map;
}
function stringifyKey(key, jsKey, ctx) {
  if (jsKey === null)
    return "";
  if (typeof jsKey !== "object")
    return String(jsKey);
  if (isNode(key) && ctx?.doc) {
    const strCtx = createStringifyContext(ctx.doc, {});
    strCtx.anchors = new Set;
    for (const node of ctx.anchors.keys())
      strCtx.anchors.add(node.anchor);
    strCtx.inFlow = true;
    strCtx.inStringifyKey = true;
    const strKey = key.toString(strCtx);
    if (!ctx.mapKeyWarned) {
      let jsonStr = JSON.stringify(strKey);
      if (jsonStr.length > 40)
        jsonStr = jsonStr.substring(0, 36) + '..."';
      warn(ctx.doc.options.logLevel, `Keys with collection values will be stringified due to JS Object restrictions: ${jsonStr}. Set mapAsMap: true to use object keys.`);
      ctx.mapKeyWarned = true;
    }
    return strKey;
  }
  return JSON.stringify(jsKey);
}

// node_modules/.bun/yaml@2.9.1/node_modules/yaml/browser/dist/nodes/Pair.js
function createPair(key, value, ctx) {
  const k = createNode(key, undefined, ctx);
  const v = createNode(value, undefined, ctx);
  return new Pair(k, v);
}

class Pair {
  constructor(key, value = null) {
    Object.defineProperty(this, NODE_TYPE, { value: PAIR });
    this.key = key;
    this.value = value;
  }
  clone(schema) {
    let { key, value } = this;
    if (isNode(key))
      key = key.clone(schema);
    if (isNode(value))
      value = value.clone(schema);
    return new Pair(key, value);
  }
  toJSON(_, ctx) {
    const pair = ctx?.mapAsMap ? new Map : {};
    return addPairToJSMap(ctx, pair, this);
  }
  toString(ctx, onComment, onChompKeep) {
    return ctx?.doc ? stringifyPair(this, ctx, onComment, onChompKeep) : JSON.stringify(this);
  }
}

// node_modules/.bun/yaml@2.9.1/node_modules/yaml/browser/dist/stringify/stringifyCollection.js
function stringifyCollection(collection, ctx, options) {
  const flow = ctx.inFlow ?? collection.flow;
  const stringify = flow ? stringifyFlowCollection : stringifyBlockCollection;
  return stringify(collection, ctx, options);
}
function stringifyBlockCollection({ comment, items }, ctx, { blockItemPrefix, flowChars, itemIndent, onChompKeep, onComment }) {
  const { indent, options: { commentString } } = ctx;
  const itemCtx = Object.assign({}, ctx, { indent: itemIndent, type: null });
  let chompKeep = false;
  const lines = [];
  for (let i = 0;i < items.length; ++i) {
    const item = items[i];
    let comment = null;
    if (isNode(item)) {
      if (!chompKeep && item.spaceBefore)
        lines.push("");
      addCommentBefore(ctx, lines, item.commentBefore, chompKeep);
      if (item.comment)
        comment = item.comment;
    } else if (isPair(item)) {
      const ik = isNode(item.key) ? item.key : null;
      if (ik) {
        if (!chompKeep && ik.spaceBefore)
          lines.push("");
        addCommentBefore(ctx, lines, ik.commentBefore, chompKeep);
      }
    }
    chompKeep = false;
    let str = stringify(item, itemCtx, () => comment = null, () => chompKeep = true);
    if (comment)
      str += lineComment(str, itemIndent, commentString(comment));
    if (chompKeep && comment)
      chompKeep = false;
    lines.push(blockItemPrefix + str);
  }
  let str;
  if (lines.length === 0) {
    str = flowChars.start + flowChars.end;
  } else {
    str = lines[0];
    for (let i = 1;i < lines.length; ++i) {
      const line = lines[i];
      str += line ? `
${indent}${line}` : `
`;
    }
  }
  if (comment) {
    str += `
` + indentComment(commentString(comment), indent);
    if (onComment)
      onComment();
  } else if (chompKeep && onChompKeep)
    onChompKeep();
  return str;
}
function stringifyFlowCollection({ items }, ctx, { flowChars, itemIndent }) {
  const { indent, indentStep, flowCollectionPadding: fcPadding, options: { commentString } } = ctx;
  itemIndent += indentStep;
  const itemCtx = Object.assign({}, ctx, {
    indent: itemIndent,
    inFlow: true,
    type: null
  });
  let reqNewline = false;
  let linesAtValue = 0;
  const lines = [];
  for (let i = 0;i < items.length; ++i) {
    const item = items[i];
    let comment = null;
    if (isNode(item)) {
      if (item.spaceBefore)
        lines.push("");
      addCommentBefore(ctx, lines, item.commentBefore, false);
      if (item.comment)
        comment = item.comment;
    } else if (isPair(item)) {
      const ik = isNode(item.key) ? item.key : null;
      if (ik) {
        if (ik.spaceBefore)
          lines.push("");
        addCommentBefore(ctx, lines, ik.commentBefore, false);
        if (ik.comment)
          reqNewline = true;
      }
      const iv = isNode(item.value) ? item.value : null;
      if (iv) {
        if (iv.comment)
          comment = iv.comment;
        if (iv.commentBefore)
          reqNewline = true;
      } else if (item.value == null && ik?.comment) {
        comment = ik.comment;
      }
    }
    if (comment)
      reqNewline = true;
    let str = stringify(item, itemCtx, () => comment = null);
    reqNewline || (reqNewline = lines.length > linesAtValue || str.includes(`
`));
    if (i < items.length - 1) {
      str += ",";
    } else if (ctx.options.trailingComma) {
      if (ctx.options.lineWidth > 0) {
        reqNewline || (reqNewline = lines.reduce((sum, line) => sum + line.length + 2, 2) + (str.length + 2) > ctx.options.lineWidth);
      }
      if (reqNewline) {
        str += ",";
      }
    }
    if (comment)
      str += lineComment(str, itemIndent, commentString(comment));
    lines.push(str);
    linesAtValue = lines.length;
  }
  const { start, end } = flowChars;
  if (lines.length === 0) {
    return start + end;
  } else {
    if (!reqNewline) {
      const len = lines.reduce((sum, line) => sum + line.length + 2, 2);
      reqNewline = ctx.options.lineWidth > 0 && len > ctx.options.lineWidth;
    }
    if (reqNewline) {
      let str = start;
      for (const line of lines)
        str += line ? `
${indentStep}${indent}${line}` : `
`;
      return `${str}
${indent}${end}`;
    } else {
      return `${start}${fcPadding}${lines.join(" ")}${fcPadding}${end}`;
    }
  }
}
function addCommentBefore({ indent, options: { commentString } }, lines, comment, chompKeep) {
  if (comment && chompKeep)
    comment = comment.replace(/^\n+/, "");
  if (comment) {
    const ic = indentComment(commentString(comment), indent);
    lines.push(ic.trimStart());
  }
}

// node_modules/.bun/yaml@2.9.1/node_modules/yaml/browser/dist/nodes/YAMLMap.js
function findPair(items, key) {
  const k = isScalar(key) ? key.value : key;
  for (const it of items) {
    if (isPair(it)) {
      if (it.key === key || it.key === k)
        return it;
      if (isScalar(it.key) && it.key.value === k)
        return it;
    }
  }
  return;
}

class YAMLMap extends Collection {
  static get tagName() {
    return "tag:yaml.org,2002:map";
  }
  constructor(schema) {
    super(MAP, schema);
    this.items = [];
  }
  static from(schema, obj, ctx) {
    const { keepUndefined, replacer } = ctx;
    const map = new this(schema);
    const add = (key, value) => {
      if (typeof replacer === "function")
        value = replacer.call(obj, key, value);
      else if (Array.isArray(replacer) && !replacer.includes(key))
        return;
      if (value !== undefined || keepUndefined)
        map.items.push(createPair(key, value, ctx));
    };
    if (obj instanceof Map) {
      for (const [key, value] of obj)
        add(key, value);
    } else if (obj && typeof obj === "object") {
      for (const key of Object.keys(obj))
        add(key, obj[key]);
    }
    if (typeof schema.sortMapEntries === "function") {
      map.items.sort(schema.sortMapEntries);
    }
    return map;
  }
  add(pair, overwrite) {
    let _pair;
    if (isPair(pair))
      _pair = pair;
    else if (!pair || typeof pair !== "object" || !("key" in pair)) {
      _pair = new Pair(pair, pair?.value);
    } else
      _pair = new Pair(pair.key, pair.value);
    const prev = findPair(this.items, _pair.key);
    const sortEntries = this.schema?.sortMapEntries;
    if (prev) {
      if (!overwrite)
        throw new Error(`Key ${_pair.key} already set`);
      if (isScalar(prev.value) && isScalarValue(_pair.value))
        prev.value.value = _pair.value;
      else
        prev.value = _pair.value;
    } else if (sortEntries) {
      const i = this.items.findIndex((item) => sortEntries(_pair, item) < 0);
      if (i === -1)
        this.items.push(_pair);
      else
        this.items.splice(i, 0, _pair);
    } else {
      this.items.push(_pair);
    }
  }
  delete(key) {
    const it = findPair(this.items, key);
    if (!it)
      return false;
    const del = this.items.splice(this.items.indexOf(it), 1);
    return del.length > 0;
  }
  get(key, keepScalar) {
    const it = findPair(this.items, key);
    const node = it?.value;
    return (!keepScalar && isScalar(node) ? node.value : node) ?? undefined;
  }
  has(key) {
    return !!findPair(this.items, key);
  }
  set(key, value) {
    this.add(new Pair(key, value), true);
  }
  toJSON(_, ctx, Type) {
    const map = Type ? new Type : ctx?.mapAsMap ? new Map : {};
    if (ctx?.onCreate)
      ctx.onCreate(map);
    for (const item of this.items)
      addPairToJSMap(ctx, map, item);
    return map;
  }
  toString(ctx, onComment, onChompKeep) {
    if (!ctx)
      return JSON.stringify(this);
    for (const item of this.items) {
      if (!isPair(item))
        throw new Error(`Map items must all be pairs; found ${JSON.stringify(item)} instead`);
    }
    if (!ctx.allNullValues && this.hasAllNullValues(false))
      ctx = Object.assign({}, ctx, { allNullValues: true });
    return stringifyCollection(this, ctx, {
      blockItemPrefix: "",
      flowChars: { start: "{", end: "}" },
      itemIndent: ctx.indent || "",
      onChompKeep,
      onComment
    });
  }
}

// node_modules/.bun/yaml@2.9.1/node_modules/yaml/browser/dist/schema/common/map.js
var map = {
  collection: "map",
  default: true,
  nodeClass: YAMLMap,
  tag: "tag:yaml.org,2002:map",
  resolve(map, onError) {
    if (!isMap(map))
      onError("Expected a mapping for this tag");
    return map;
  },
  createNode: (schema, obj, ctx) => YAMLMap.from(schema, obj, ctx)
};

// node_modules/.bun/yaml@2.9.1/node_modules/yaml/browser/dist/nodes/YAMLSeq.js
class YAMLSeq extends Collection {
  static get tagName() {
    return "tag:yaml.org,2002:seq";
  }
  constructor(schema) {
    super(SEQ, schema);
    this.items = [];
  }
  add(value) {
    this.items.push(value);
  }
  delete(key) {
    const idx = asItemIndex(key);
    if (typeof idx !== "number")
      return false;
    const del = this.items.splice(idx, 1);
    return del.length > 0;
  }
  get(key, keepScalar) {
    const idx = asItemIndex(key);
    if (typeof idx !== "number")
      return;
    const it = this.items[idx];
    return !keepScalar && isScalar(it) ? it.value : it;
  }
  has(key) {
    const idx = asItemIndex(key);
    return typeof idx === "number" && idx < this.items.length;
  }
  set(key, value) {
    const idx = asItemIndex(key);
    if (typeof idx !== "number")
      throw new Error(`Expected a valid index, not ${key}.`);
    const prev = this.items[idx];
    if (isScalar(prev) && isScalarValue(value))
      prev.value = value;
    else
      this.items[idx] = value;
  }
  toJSON(_, ctx) {
    const seq = [];
    if (ctx?.onCreate)
      ctx.onCreate(seq);
    let i = 0;
    for (const item of this.items)
      seq.push(toJS(item, String(i++), ctx));
    return seq;
  }
  toString(ctx, onComment, onChompKeep) {
    if (!ctx)
      return JSON.stringify(this);
    return stringifyCollection(this, ctx, {
      blockItemPrefix: "- ",
      flowChars: { start: "[", end: "]" },
      itemIndent: (ctx.indent || "") + "  ",
      onChompKeep,
      onComment
    });
  }
  static from(schema, obj, ctx) {
    const { replacer } = ctx;
    const seq = new this(schema);
    if (obj && Symbol.iterator in Object(obj)) {
      let i = 0;
      for (let it of obj) {
        if (typeof replacer === "function") {
          const key = obj instanceof Set ? it : String(i++);
          it = replacer.call(obj, key, it);
        }
        seq.items.push(createNode(it, undefined, ctx));
      }
    }
    return seq;
  }
}
function asItemIndex(key) {
  let idx = isScalar(key) ? key.value : key;
  if (idx && typeof idx === "string")
    idx = Number(idx);
  return typeof idx === "number" && Number.isInteger(idx) && idx >= 0 ? idx : null;
}

// node_modules/.bun/yaml@2.9.1/node_modules/yaml/browser/dist/schema/common/seq.js
var seq = {
  collection: "seq",
  default: true,
  nodeClass: YAMLSeq,
  tag: "tag:yaml.org,2002:seq",
  resolve(seq, onError) {
    if (!isSeq(seq))
      onError("Expected a sequence for this tag");
    return seq;
  },
  createNode: (schema, obj, ctx) => YAMLSeq.from(schema, obj, ctx)
};

// node_modules/.bun/yaml@2.9.1/node_modules/yaml/browser/dist/schema/common/string.js
var string = {
  identify: (value) => typeof value === "string",
  default: true,
  tag: "tag:yaml.org,2002:str",
  resolve: (str) => str,
  stringify(item, ctx, onComment, onChompKeep) {
    ctx = Object.assign({ actualString: true }, ctx);
    return stringifyString(item, ctx, onComment, onChompKeep);
  }
};

// node_modules/.bun/yaml@2.9.1/node_modules/yaml/browser/dist/schema/common/null.js
var nullTag = {
  identify: (value) => value == null,
  createNode: () => new Scalar(null),
  default: true,
  tag: "tag:yaml.org,2002:null",
  test: /^(?:~|[Nn]ull|NULL)?$/,
  resolve: () => new Scalar(null),
  stringify: ({ source }, ctx) => typeof source === "string" && nullTag.test.test(source) ? source : ctx.options.nullStr
};

// node_modules/.bun/yaml@2.9.1/node_modules/yaml/browser/dist/schema/core/bool.js
var boolTag = {
  identify: (value) => typeof value === "boolean",
  default: true,
  tag: "tag:yaml.org,2002:bool",
  test: /^(?:[Tt]rue|TRUE|[Ff]alse|FALSE)$/,
  resolve: (str) => new Scalar(str[0] === "t" || str[0] === "T"),
  stringify({ source, value }, ctx) {
    if (source && boolTag.test.test(source)) {
      const sv = source[0] === "t" || source[0] === "T";
      if (value === sv)
        return source;
    }
    return value ? ctx.options.trueStr : ctx.options.falseStr;
  }
};

// node_modules/.bun/yaml@2.9.1/node_modules/yaml/browser/dist/stringify/stringifyNumber.js
function stringifyNumber({ format, minFractionDigits, tag, value }) {
  if (typeof value === "bigint")
    return String(value);
  const num = typeof value === "number" ? value : Number(value);
  if (!isFinite(num))
    return isNaN(num) ? ".nan" : num < 0 ? "-.inf" : ".inf";
  let n = Object.is(value, -0) ? "-0" : JSON.stringify(value);
  if (!format && minFractionDigits && (!tag || tag === "tag:yaml.org,2002:float") && /^-?\d/.test(n) && !n.includes("e")) {
    let i = n.indexOf(".");
    if (i < 0) {
      i = n.length;
      n += ".";
    }
    let d = minFractionDigits - (n.length - i - 1);
    while (d-- > 0)
      n += "0";
  }
  return n;
}

// node_modules/.bun/yaml@2.9.1/node_modules/yaml/browser/dist/schema/core/float.js
var floatNaN = {
  identify: (value) => typeof value === "number",
  default: true,
  tag: "tag:yaml.org,2002:float",
  test: /^(?:[-+]?\.(?:inf|Inf|INF)|\.nan|\.NaN|\.NAN)$/,
  resolve: (str) => str.slice(-3).toLowerCase() === "nan" ? NaN : str[0] === "-" ? Number.NEGATIVE_INFINITY : Number.POSITIVE_INFINITY,
  stringify: stringifyNumber
};
var floatExp = {
  identify: (value) => typeof value === "number",
  default: true,
  tag: "tag:yaml.org,2002:float",
  format: "EXP",
  test: /^[-+]?(?:\.[0-9]+|[0-9]+(?:\.[0-9]*)?)[eE][-+]?[0-9]+$/,
  resolve: (str) => parseFloat(str),
  stringify(node) {
    const num = Number(node.value);
    return isFinite(num) ? num.toExponential() : stringifyNumber(node);
  }
};
var float = {
  identify: (value) => typeof value === "number",
  default: true,
  tag: "tag:yaml.org,2002:float",
  test: /^[-+]?(?:\.[0-9]+|[0-9]+\.[0-9]*)$/,
  resolve(str) {
    const node = new Scalar(parseFloat(str));
    const dot = str.indexOf(".");
    if (dot !== -1 && str[str.length - 1] === "0")
      node.minFractionDigits = str.length - dot - 1;
    return node;
  },
  stringify: stringifyNumber
};

// node_modules/.bun/yaml@2.9.1/node_modules/yaml/browser/dist/schema/core/int.js
var intIdentify = (value) => typeof value === "bigint" || Number.isInteger(value);
var intResolve = (str, offset, radix, { intAsBigInt }) => intAsBigInt ? BigInt(str) : parseInt(str.substring(offset), radix);
function intStringify(node, radix, prefix) {
  const { value } = node;
  if (intIdentify(value) && value >= 0)
    return prefix + value.toString(radix);
  return stringifyNumber(node);
}
var intOct = {
  identify: (value) => intIdentify(value) && value >= 0,
  default: true,
  tag: "tag:yaml.org,2002:int",
  format: "OCT",
  test: /^0o[0-7]+$/,
  resolve: (str, _onError, opt) => intResolve(str, 2, 8, opt),
  stringify: (node) => intStringify(node, 8, "0o")
};
var int = {
  identify: intIdentify,
  default: true,
  tag: "tag:yaml.org,2002:int",
  test: /^[-+]?[0-9]+$/,
  resolve: (str, _onError, opt) => intResolve(str, 0, 10, opt),
  stringify: stringifyNumber
};
var intHex = {
  identify: (value) => intIdentify(value) && value >= 0,
  default: true,
  tag: "tag:yaml.org,2002:int",
  format: "HEX",
  test: /^0x[0-9a-fA-F]+$/,
  resolve: (str, _onError, opt) => intResolve(str, 2, 16, opt),
  stringify: (node) => intStringify(node, 16, "0x")
};

// node_modules/.bun/yaml@2.9.1/node_modules/yaml/browser/dist/schema/core/schema.js
var schema = [
  map,
  seq,
  string,
  nullTag,
  boolTag,
  intOct,
  int,
  intHex,
  floatNaN,
  floatExp,
  float
];

// node_modules/.bun/yaml@2.9.1/node_modules/yaml/browser/dist/schema/json/schema.js
function intIdentify2(value) {
  return typeof value === "bigint" || Number.isInteger(value);
}
var stringifyJSON = ({ value }) => JSON.stringify(value);
var jsonScalars = [
  {
    identify: (value) => typeof value === "string",
    default: true,
    tag: "tag:yaml.org,2002:str",
    resolve: (str) => str,
    stringify: stringifyJSON
  },
  {
    identify: (value) => value == null,
    createNode: () => new Scalar(null),
    default: true,
    tag: "tag:yaml.org,2002:null",
    test: /^null$/,
    resolve: () => null,
    stringify: stringifyJSON
  },
  {
    identify: (value) => typeof value === "boolean",
    default: true,
    tag: "tag:yaml.org,2002:bool",
    test: /^true$|^false$/,
    resolve: (str) => str === "true",
    stringify: stringifyJSON
  },
  {
    identify: intIdentify2,
    default: true,
    tag: "tag:yaml.org,2002:int",
    test: /^-?(?:0|[1-9][0-9]*)$/,
    resolve: (str, _onError, { intAsBigInt }) => intAsBigInt ? BigInt(str) : parseInt(str, 10),
    stringify: ({ value }) => intIdentify2(value) ? value.toString() : JSON.stringify(value)
  },
  {
    identify: (value) => typeof value === "number",
    default: true,
    tag: "tag:yaml.org,2002:float",
    test: /^-?(?:0|[1-9][0-9]*)(?:\.[0-9]*)?(?:[eE][-+]?[0-9]+)?$/,
    resolve: (str) => parseFloat(str),
    stringify: stringifyJSON
  }
];
var jsonError = {
  default: true,
  tag: "",
  test: /^/,
  resolve(str, onError) {
    onError(`Unresolved plain scalar ${JSON.stringify(str)}`);
    return str;
  }
};
var schema2 = [map, seq].concat(jsonScalars, jsonError);

// node_modules/.bun/yaml@2.9.1/node_modules/yaml/browser/dist/schema/yaml-1.1/binary.js
var binary = {
  identify: (value) => value instanceof Uint8Array,
  default: false,
  tag: "tag:yaml.org,2002:binary",
  resolve(src, onError) {
    if (typeof atob === "function") {
      const str = atob(src.replace(/[\n\r]/g, ""));
      const buffer = new Uint8Array(str.length);
      for (let i = 0;i < str.length; ++i)
        buffer[i] = str.charCodeAt(i);
      return buffer;
    } else {
      onError("This environment does not support reading binary tags; either Buffer or atob is required");
      return src;
    }
  },
  stringify({ comment, type, value }, ctx, onComment, onChompKeep) {
    if (!value)
      return "";
    const buf = value;
    let str;
    if (typeof btoa === "function") {
      let s = "";
      for (let i = 0;i < buf.length; ++i)
        s += String.fromCharCode(buf[i]);
      str = btoa(s);
    } else {
      throw new Error("This environment does not support writing binary tags; either Buffer or btoa is required");
    }
    type ?? (type = Scalar.BLOCK_LITERAL);
    if (type !== Scalar.QUOTE_DOUBLE) {
      const lineWidth = Math.max(ctx.options.lineWidth - ctx.indent.length, ctx.options.minContentWidth);
      const n = Math.ceil(str.length / lineWidth);
      const lines = new Array(n);
      for (let i = 0, o = 0;i < n; ++i, o += lineWidth) {
        lines[i] = str.substr(o, lineWidth);
      }
      str = lines.join(type === Scalar.BLOCK_LITERAL ? `
` : " ");
    }
    return stringifyString({ comment, type, value: str }, ctx, onComment, onChompKeep);
  }
};

// node_modules/.bun/yaml@2.9.1/node_modules/yaml/browser/dist/schema/yaml-1.1/pairs.js
function resolvePairs(seq, onError) {
  if (isSeq(seq)) {
    for (let i = 0;i < seq.items.length; ++i) {
      let item = seq.items[i];
      if (isPair(item))
        continue;
      else if (isMap(item)) {
        if (item.items.length > 1)
          onError("Each pair must have its own sequence indicator");
        const pair = item.items[0] || new Pair(new Scalar(null));
        if (item.commentBefore)
          pair.key.commentBefore = pair.key.commentBefore ? `${item.commentBefore}
${pair.key.commentBefore}` : item.commentBefore;
        if (item.comment) {
          const cn = pair.value ?? pair.key;
          cn.comment = cn.comment ? `${item.comment}
${cn.comment}` : item.comment;
        }
        item = pair;
      }
      seq.items[i] = isPair(item) ? item : new Pair(item);
    }
  } else
    onError("Expected a sequence for this tag");
  return seq;
}
function createPairs(schema, iterable, ctx) {
  const { replacer } = ctx;
  const pairs = new YAMLSeq(schema);
  pairs.tag = "tag:yaml.org,2002:pairs";
  let i = 0;
  if (iterable && Symbol.iterator in Object(iterable))
    for (let it of iterable) {
      if (typeof replacer === "function")
        it = replacer.call(iterable, String(i++), it);
      let key, value;
      if (Array.isArray(it)) {
        if (it.length === 2) {
          key = it[0];
          value = it[1];
        } else
          throw new TypeError(`Expected [key, value] tuple: ${it}`);
      } else if (it && it instanceof Object) {
        const keys = Object.keys(it);
        if (keys.length === 1) {
          key = keys[0];
          value = it[key];
        } else {
          throw new TypeError(`Expected tuple with one key, not ${keys.length} keys`);
        }
      } else {
        key = it;
      }
      pairs.items.push(createPair(key, value, ctx));
    }
  return pairs;
}
var pairs = {
  collection: "seq",
  default: false,
  tag: "tag:yaml.org,2002:pairs",
  resolve: resolvePairs,
  createNode: createPairs
};

// node_modules/.bun/yaml@2.9.1/node_modules/yaml/browser/dist/schema/yaml-1.1/omap.js
class YAMLOMap extends YAMLSeq {
  constructor() {
    super();
    this.add = YAMLMap.prototype.add.bind(this);
    this.delete = YAMLMap.prototype.delete.bind(this);
    this.get = YAMLMap.prototype.get.bind(this);
    this.has = YAMLMap.prototype.has.bind(this);
    this.set = YAMLMap.prototype.set.bind(this);
    this.tag = YAMLOMap.tag;
  }
  toJSON(_, ctx) {
    if (!ctx)
      return super.toJSON(_);
    const map = new Map;
    if (ctx?.onCreate)
      ctx.onCreate(map);
    for (const pair of this.items) {
      let key, value;
      if (isPair(pair)) {
        key = toJS(pair.key, "", ctx);
        value = toJS(pair.value, key, ctx);
      } else {
        key = toJS(pair, "", ctx);
      }
      if (map.has(key))
        throw new Error("Ordered maps must not include duplicate keys");
      map.set(key, value);
    }
    return map;
  }
  static from(schema, iterable, ctx) {
    const pairs = createPairs(schema, iterable, ctx);
    const omap = new this;
    omap.items = pairs.items;
    return omap;
  }
}
YAMLOMap.tag = "tag:yaml.org,2002:omap";
var omap = {
  collection: "seq",
  identify: (value) => value instanceof Map,
  nodeClass: YAMLOMap,
  default: false,
  tag: "tag:yaml.org,2002:omap",
  resolve(seq, onError) {
    const pairs = resolvePairs(seq, onError);
    const seenKeys = [];
    for (const { key } of pairs.items) {
      if (isScalar(key)) {
        if (seenKeys.includes(key.value)) {
          onError(`Ordered maps must not include duplicate keys: ${key.value}`);
        } else {
          seenKeys.push(key.value);
        }
      }
    }
    return Object.assign(new YAMLOMap, pairs);
  },
  createNode: (schema, iterable, ctx) => YAMLOMap.from(schema, iterable, ctx)
};

// node_modules/.bun/yaml@2.9.1/node_modules/yaml/browser/dist/schema/yaml-1.1/bool.js
function boolStringify({ value, source }, ctx) {
  const boolObj = value ? trueTag : falseTag;
  if (source && boolObj.test.test(source))
    return source;
  return value ? ctx.options.trueStr : ctx.options.falseStr;
}
var trueTag = {
  identify: (value) => value === true,
  default: true,
  tag: "tag:yaml.org,2002:bool",
  test: /^(?:Y|y|[Yy]es|YES|[Tt]rue|TRUE|[Oo]n|ON)$/,
  resolve: () => new Scalar(true),
  stringify: boolStringify
};
var falseTag = {
  identify: (value) => value === false,
  default: true,
  tag: "tag:yaml.org,2002:bool",
  test: /^(?:N|n|[Nn]o|NO|[Ff]alse|FALSE|[Oo]ff|OFF)$/,
  resolve: () => new Scalar(false),
  stringify: boolStringify
};

// node_modules/.bun/yaml@2.9.1/node_modules/yaml/browser/dist/schema/yaml-1.1/float.js
var floatNaN2 = {
  identify: (value) => typeof value === "number",
  default: true,
  tag: "tag:yaml.org,2002:float",
  test: /^(?:[-+]?\.(?:inf|Inf|INF)|\.nan|\.NaN|\.NAN)$/,
  resolve: (str) => str.slice(-3).toLowerCase() === "nan" ? NaN : str[0] === "-" ? Number.NEGATIVE_INFINITY : Number.POSITIVE_INFINITY,
  stringify: stringifyNumber
};
var floatExp2 = {
  identify: (value) => typeof value === "number",
  default: true,
  tag: "tag:yaml.org,2002:float",
  format: "EXP",
  test: /^[-+]?(?:[0-9][0-9_]*)?(?:\.[0-9_]*)?[eE][-+]?[0-9]+$/,
  resolve: (str) => parseFloat(str.replace(/_/g, "")),
  stringify(node) {
    const num = Number(node.value);
    return isFinite(num) ? num.toExponential() : stringifyNumber(node);
  }
};
var float2 = {
  identify: (value) => typeof value === "number",
  default: true,
  tag: "tag:yaml.org,2002:float",
  test: /^[-+]?(?:[0-9][0-9_]*)?\.[0-9_]*$/,
  resolve(str) {
    const node = new Scalar(parseFloat(str.replace(/_/g, "")));
    const dot = str.indexOf(".");
    if (dot !== -1) {
      const f = str.substring(dot + 1).replace(/_/g, "");
      if (f[f.length - 1] === "0")
        node.minFractionDigits = f.length;
    }
    return node;
  },
  stringify: stringifyNumber
};

// node_modules/.bun/yaml@2.9.1/node_modules/yaml/browser/dist/schema/yaml-1.1/int.js
var intIdentify3 = (value) => typeof value === "bigint" || Number.isInteger(value);
function intResolve2(str, offset, radix, { intAsBigInt }) {
  const sign = str[0];
  if (sign === "-" || sign === "+")
    offset += 1;
  str = str.substring(offset).replace(/_/g, "");
  if (intAsBigInt) {
    switch (radix) {
      case 2:
        str = `0b${str}`;
        break;
      case 8:
        str = `0o${str}`;
        break;
      case 16:
        str = `0x${str}`;
        break;
    }
    const n = BigInt(str);
    return sign === "-" ? BigInt(-1) * n : n;
  }
  const n = parseInt(str, radix);
  return sign === "-" ? -1 * n : n;
}
function intStringify2(node, radix, prefix) {
  const { value } = node;
  if (intIdentify3(value)) {
    const str = value.toString(radix);
    return value < 0 ? "-" + prefix + str.substr(1) : prefix + str;
  }
  return stringifyNumber(node);
}
var intBin = {
  identify: intIdentify3,
  default: true,
  tag: "tag:yaml.org,2002:int",
  format: "BIN",
  test: /^[-+]?0b[0-1_]+$/,
  resolve: (str, _onError, opt) => intResolve2(str, 2, 2, opt),
  stringify: (node) => intStringify2(node, 2, "0b")
};
var intOct2 = {
  identify: intIdentify3,
  default: true,
  tag: "tag:yaml.org,2002:int",
  format: "OCT",
  test: /^[-+]?0[0-7_]+$/,
  resolve: (str, _onError, opt) => intResolve2(str, 1, 8, opt),
  stringify: (node) => intStringify2(node, 8, "0")
};
var int2 = {
  identify: intIdentify3,
  default: true,
  tag: "tag:yaml.org,2002:int",
  test: /^[-+]?[0-9][0-9_]*$/,
  resolve: (str, _onError, opt) => intResolve2(str, 0, 10, opt),
  stringify: stringifyNumber
};
var intHex2 = {
  identify: intIdentify3,
  default: true,
  tag: "tag:yaml.org,2002:int",
  format: "HEX",
  test: /^[-+]?0x[0-9a-fA-F_]+$/,
  resolve: (str, _onError, opt) => intResolve2(str, 2, 16, opt),
  stringify: (node) => intStringify2(node, 16, "0x")
};

// node_modules/.bun/yaml@2.9.1/node_modules/yaml/browser/dist/schema/yaml-1.1/set.js
class YAMLSet extends YAMLMap {
  constructor(schema) {
    super(schema);
    this.tag = YAMLSet.tag;
  }
  add(key) {
    let pair;
    if (isPair(key))
      pair = key;
    else if (key && typeof key === "object" && "key" in key && "value" in key && key.value === null)
      pair = new Pair(key.key, null);
    else
      pair = new Pair(key, null);
    const prev = findPair(this.items, pair.key);
    if (!prev)
      this.items.push(pair);
  }
  get(key, keepPair) {
    const pair = findPair(this.items, key);
    return !keepPair && isPair(pair) ? isScalar(pair.key) ? pair.key.value : pair.key : pair;
  }
  set(key, value) {
    if (typeof value !== "boolean")
      throw new Error(`Expected boolean value for set(key, value) in a YAML set, not ${typeof value}`);
    const prev = findPair(this.items, key);
    if (prev && !value) {
      this.items.splice(this.items.indexOf(prev), 1);
    } else if (!prev && value) {
      this.items.push(new Pair(key));
    }
  }
  toJSON(_, ctx) {
    return super.toJSON(_, ctx, Set);
  }
  toString(ctx, onComment, onChompKeep) {
    if (!ctx)
      return JSON.stringify(this);
    if (this.hasAllNullValues(true))
      return super.toString(Object.assign({}, ctx, { allNullValues: true }), onComment, onChompKeep);
    else
      throw new Error("Set items must all have null values");
  }
  static from(schema, iterable, ctx) {
    const { replacer } = ctx;
    const set = new this(schema);
    if (iterable && Symbol.iterator in Object(iterable))
      for (let value of iterable) {
        if (typeof replacer === "function")
          value = replacer.call(iterable, value, value);
        set.items.push(createPair(value, null, ctx));
      }
    return set;
  }
}
YAMLSet.tag = "tag:yaml.org,2002:set";
var set = {
  collection: "map",
  identify: (value) => value instanceof Set,
  nodeClass: YAMLSet,
  default: false,
  tag: "tag:yaml.org,2002:set",
  createNode: (schema, iterable, ctx) => YAMLSet.from(schema, iterable, ctx),
  resolve(map, onError) {
    if (isMap(map)) {
      if (map.hasAllNullValues(true))
        return Object.assign(new YAMLSet, map);
      else
        onError("Set items must all have null values");
    } else
      onError("Expected a mapping for this tag");
    return map;
  }
};

// node_modules/.bun/yaml@2.9.1/node_modules/yaml/browser/dist/schema/yaml-1.1/timestamp.js
function parseSexagesimal(str, asBigInt) {
  const sign = str[0];
  const parts = sign === "-" || sign === "+" ? str.substring(1) : str;
  const num = (n) => asBigInt ? BigInt(n) : Number(n);
  const res = parts.replace(/_/g, "").split(":").reduce((res, p) => res * num(60) + num(p), num(0));
  return sign === "-" ? num(-1) * res : res;
}
function stringifySexagesimal(node) {
  let { value } = node;
  let num = (n) => n;
  if (typeof value === "bigint")
    num = (n) => BigInt(n);
  else if (isNaN(value) || !isFinite(value))
    return stringifyNumber(node);
  let sign = "";
  if (value < 0) {
    sign = "-";
    value *= num(-1);
  }
  const _60 = num(60);
  const parts = [value % _60];
  if (value < 60) {
    parts.unshift(0);
  } else {
    value = (value - parts[0]) / _60;
    parts.unshift(value % _60);
    if (value >= 60) {
      value = (value - parts[0]) / _60;
      parts.unshift(value);
    }
  }
  return sign + parts.map((n) => String(n).padStart(2, "0")).join(":").replace(/000000\d*$/, "");
}
var intTime = {
  identify: (value) => typeof value === "bigint" || Number.isInteger(value),
  default: true,
  tag: "tag:yaml.org,2002:int",
  format: "TIME",
  test: /^[-+]?[0-9][0-9_]*(?::[0-5]?[0-9])+$/,
  resolve: (str, _onError, { intAsBigInt }) => parseSexagesimal(str, intAsBigInt),
  stringify: stringifySexagesimal
};
var floatTime = {
  identify: (value) => typeof value === "number",
  default: true,
  tag: "tag:yaml.org,2002:float",
  format: "TIME",
  test: /^[-+]?[0-9][0-9_]*(?::[0-5]?[0-9])+\.[0-9_]*$/,
  resolve: (str) => parseSexagesimal(str, false),
  stringify: stringifySexagesimal
};
var timestamp = {
  identify: (value) => value instanceof Date,
  default: true,
  tag: "tag:yaml.org,2002:timestamp",
  test: RegExp("^([0-9]{4})-([0-9]{1,2})-([0-9]{1,2})" + "(?:" + "(?:t|T|[ \\t]+)" + "([0-9]{1,2}):([0-9]{1,2}):([0-9]{1,2}(\\.[0-9]+)?)" + "(?:[ \\t]*(Z|[-+][012]?[0-9](?::[0-9]{2})?))?" + ")?$"),
  resolve(str) {
    const match = str.match(timestamp.test);
    if (!match)
      throw new Error("!!timestamp expects a date, starting with yyyy-mm-dd");
    const [, year, month, day, hour, minute, second] = match.map(Number);
    const millisec = match[7] ? Number((match[7] + "00").substr(1, 3)) : 0;
    let date = Date.UTC(year, month - 1, day, hour || 0, minute || 0, second || 0, millisec);
    const tz = match[8];
    if (tz && tz !== "Z") {
      let d = parseSexagesimal(tz, false);
      if (Math.abs(d) < 30)
        d *= 60;
      date -= 60000 * d;
    }
    return new Date(date);
  },
  stringify: ({ value }) => value?.toISOString().replace(/(T00:00:00)?\.000Z$/, "") ?? ""
};

// node_modules/.bun/yaml@2.9.1/node_modules/yaml/browser/dist/schema/yaml-1.1/schema.js
var schema3 = [
  map,
  seq,
  string,
  nullTag,
  trueTag,
  falseTag,
  intBin,
  intOct2,
  int2,
  intHex2,
  floatNaN2,
  floatExp2,
  float2,
  binary,
  merge,
  omap,
  pairs,
  set,
  intTime,
  floatTime,
  timestamp
];

// node_modules/.bun/yaml@2.9.1/node_modules/yaml/browser/dist/schema/tags.js
var schemas = new Map([
  ["core", schema],
  ["failsafe", [map, seq, string]],
  ["json", schema2],
  ["yaml11", schema3],
  ["yaml-1.1", schema3]
]);
var tagsByName = {
  binary,
  bool: boolTag,
  float,
  floatExp,
  floatNaN,
  floatTime,
  int,
  intHex,
  intOct,
  intTime,
  map,
  merge,
  null: nullTag,
  omap,
  pairs,
  seq,
  set,
  timestamp
};
var coreKnownTags = {
  "tag:yaml.org,2002:binary": binary,
  "tag:yaml.org,2002:merge": merge,
  "tag:yaml.org,2002:omap": omap,
  "tag:yaml.org,2002:pairs": pairs,
  "tag:yaml.org,2002:set": set,
  "tag:yaml.org,2002:timestamp": timestamp
};
function getTags(customTags, schemaName, addMergeTag) {
  const schemaTags = schemas.get(schemaName);
  if (schemaTags && !customTags) {
    return addMergeTag && !schemaTags.includes(merge) ? schemaTags.concat(merge) : schemaTags.slice();
  }
  let tags = schemaTags;
  if (!tags) {
    if (Array.isArray(customTags))
      tags = [];
    else {
      const keys = Array.from(schemas.keys()).filter((key) => key !== "yaml11").map((key) => JSON.stringify(key)).join(", ");
      throw new Error(`Unknown schema "${schemaName}"; use one of ${keys} or define customTags array`);
    }
  }
  if (Array.isArray(customTags)) {
    for (const tag of customTags)
      tags = tags.concat(tag);
  } else if (typeof customTags === "function") {
    tags = customTags(tags.slice());
  }
  if (addMergeTag)
    tags = tags.concat(merge);
  return tags.reduce((tags, tag) => {
    const tagObj = typeof tag === "string" ? tagsByName[tag] : tag;
    if (!tagObj) {
      const tagName = JSON.stringify(tag);
      const keys = Object.keys(tagsByName).map((key) => JSON.stringify(key)).join(", ");
      throw new Error(`Unknown custom tag ${tagName}; use one of ${keys}`);
    }
    if (!tags.includes(tagObj))
      tags.push(tagObj);
    return tags;
  }, []);
}

// node_modules/.bun/yaml@2.9.1/node_modules/yaml/browser/dist/schema/Schema.js
var sortMapEntriesByKey = (a, b) => a.key < b.key ? -1 : a.key > b.key ? 1 : 0;

class Schema {
  constructor({ compat, customTags, merge, resolveKnownTags, schema, sortMapEntries, toStringDefaults }) {
    this.compat = Array.isArray(compat) ? getTags(compat, "compat") : compat ? getTags(null, compat) : null;
    this.name = typeof schema === "string" && schema || "core";
    this.knownTags = resolveKnownTags ? coreKnownTags : {};
    this.tags = getTags(customTags, this.name, merge);
    this.toStringOptions = toStringDefaults ?? null;
    Object.defineProperty(this, MAP, { value: map });
    Object.defineProperty(this, SCALAR, { value: string });
    Object.defineProperty(this, SEQ, { value: seq });
    this.sortMapEntries = typeof sortMapEntries === "function" ? sortMapEntries : sortMapEntries === true ? sortMapEntriesByKey : null;
  }
  clone() {
    const copy = Object.create(Schema.prototype, Object.getOwnPropertyDescriptors(this));
    copy.tags = this.tags.slice();
    return copy;
  }
}

// node_modules/.bun/yaml@2.9.1/node_modules/yaml/browser/dist/stringify/stringifyDocument.js
function stringifyDocument(doc, options) {
  const lines = [];
  let hasDirectives = options.directives === true;
  if (options.directives !== false && doc.directives) {
    const dir = doc.directives.toString(doc);
    if (dir) {
      lines.push(dir);
      hasDirectives = true;
    } else if (doc.directives.docStart)
      hasDirectives = true;
  }
  if (hasDirectives)
    lines.push("---");
  const ctx = createStringifyContext(doc, options);
  const { commentString } = ctx.options;
  if (doc.commentBefore) {
    if (lines.length !== 1)
      lines.unshift("");
    const cs = commentString(doc.commentBefore);
    lines.unshift(indentComment(cs, ""));
  }
  let chompKeep = false;
  let contentComment = null;
  if (doc.contents) {
    if (isNode(doc.contents)) {
      if (doc.contents.spaceBefore && hasDirectives)
        lines.push("");
      if (doc.contents.commentBefore) {
        const cs = commentString(doc.contents.commentBefore);
        lines.push(indentComment(cs, ""));
      }
      ctx.forceBlockIndent = !!doc.comment;
      contentComment = doc.contents.comment;
    }
    const onChompKeep = contentComment ? undefined : () => chompKeep = true;
    let body = stringify(doc.contents, ctx, () => contentComment = null, onChompKeep);
    if (contentComment)
      body += lineComment(body, "", commentString(contentComment));
    if ((body[0] === "|" || body[0] === ">") && lines[lines.length - 1] === "---") {
      lines[lines.length - 1] = `--- ${body}`;
    } else
      lines.push(body);
  } else {
    lines.push(stringify(doc.contents, ctx));
  }
  if (doc.directives?.docEnd) {
    if (doc.comment) {
      const cs = commentString(doc.comment);
      if (cs.includes(`
`)) {
        lines.push("...");
        lines.push(indentComment(cs, ""));
      } else {
        lines.push(`... ${cs}`);
      }
    } else {
      lines.push("...");
    }
  } else {
    let dc = doc.comment;
    if (dc && chompKeep)
      dc = dc.replace(/^\n+/, "");
    if (dc) {
      if ((!chompKeep || contentComment) && lines[lines.length - 1] !== "")
        lines.push("");
      lines.push(indentComment(commentString(dc), ""));
    }
  }
  return lines.join(`
`) + `
`;
}

// node_modules/.bun/yaml@2.9.1/node_modules/yaml/browser/dist/doc/Document.js
class Document {
  constructor(value, replacer, options) {
    this.commentBefore = null;
    this.comment = null;
    this.errors = [];
    this.warnings = [];
    Object.defineProperty(this, NODE_TYPE, { value: DOC });
    let _replacer = null;
    if (typeof replacer === "function" || Array.isArray(replacer)) {
      _replacer = replacer;
    } else if (options === undefined && replacer) {
      options = replacer;
      replacer = undefined;
    }
    const opt = Object.assign({
      intAsBigInt: false,
      keepSourceTokens: false,
      logLevel: "warn",
      prettyErrors: true,
      strict: true,
      stringKeys: false,
      uniqueKeys: true,
      version: "1.2"
    }, options);
    this.options = opt;
    let { version } = opt;
    if (options?._directives) {
      this.directives = options._directives.atDocument();
      if (this.directives.yaml.explicit)
        version = this.directives.yaml.version;
    } else
      this.directives = new Directives({ version });
    this.setSchema(version, options);
    this.contents = value === undefined ? null : this.createNode(value, _replacer, options);
  }
  clone() {
    const copy = Object.create(Document.prototype, {
      [NODE_TYPE]: { value: DOC }
    });
    copy.commentBefore = this.commentBefore;
    copy.comment = this.comment;
    copy.errors = this.errors.slice();
    copy.warnings = this.warnings.slice();
    copy.options = Object.assign({}, this.options);
    if (this.directives)
      copy.directives = this.directives.clone();
    copy.schema = this.schema.clone();
    copy.contents = isNode(this.contents) ? this.contents.clone(copy.schema) : this.contents;
    if (this.range)
      copy.range = this.range.slice();
    return copy;
  }
  add(value) {
    if (assertCollection(this.contents))
      this.contents.add(value);
  }
  addIn(path, value) {
    if (assertCollection(this.contents))
      this.contents.addIn(path, value);
  }
  createAlias(node, name) {
    if (!node.anchor) {
      const prev = anchorNames(this);
      node.anchor = !name || prev.has(name) ? findNewAnchor(name || "a", prev) : name;
    }
    return new Alias(node.anchor);
  }
  createNode(value, replacer, options) {
    let _replacer = undefined;
    if (typeof replacer === "function") {
      value = replacer.call({ "": value }, "", value);
      _replacer = replacer;
    } else if (Array.isArray(replacer)) {
      const keyToStr = (v) => typeof v === "number" || v instanceof String || v instanceof Number;
      const asStr = replacer.filter(keyToStr).map(String);
      if (asStr.length > 0)
        replacer = replacer.concat(asStr);
      _replacer = replacer;
    } else if (options === undefined && replacer) {
      options = replacer;
      replacer = undefined;
    }
    const { aliasDuplicateObjects, anchorPrefix, flow, keepUndefined, onTagObj, tag } = options ?? {};
    const { onAnchor, setAnchors, sourceObjects } = createNodeAnchors(this, anchorPrefix || "a");
    const ctx = {
      aliasDuplicateObjects: aliasDuplicateObjects ?? true,
      keepUndefined: keepUndefined ?? false,
      onAnchor,
      onTagObj,
      replacer: _replacer,
      schema: this.schema,
      sourceObjects
    };
    const node = createNode(value, tag, ctx);
    if (flow && isCollection(node))
      node.flow = true;
    setAnchors();
    return node;
  }
  createPair(key, value, options = {}) {
    const k = this.createNode(key, null, options);
    const v = this.createNode(value, null, options);
    return new Pair(k, v);
  }
  delete(key) {
    return assertCollection(this.contents) ? this.contents.delete(key) : false;
  }
  deleteIn(path) {
    if (isEmptyPath(path)) {
      if (this.contents == null)
        return false;
      this.contents = null;
      return true;
    }
    return assertCollection(this.contents) ? this.contents.deleteIn(path) : false;
  }
  get(key, keepScalar) {
    return isCollection(this.contents) ? this.contents.get(key, keepScalar) : undefined;
  }
  getIn(path, keepScalar) {
    if (isEmptyPath(path))
      return !keepScalar && isScalar(this.contents) ? this.contents.value : this.contents;
    return isCollection(this.contents) ? this.contents.getIn(path, keepScalar) : undefined;
  }
  has(key) {
    return isCollection(this.contents) ? this.contents.has(key) : false;
  }
  hasIn(path) {
    if (isEmptyPath(path))
      return this.contents !== undefined;
    return isCollection(this.contents) ? this.contents.hasIn(path) : false;
  }
  set(key, value) {
    if (this.contents == null) {
      this.contents = collectionFromPath(this.schema, [key], value);
    } else if (assertCollection(this.contents)) {
      this.contents.set(key, value);
    }
  }
  setIn(path, value) {
    if (isEmptyPath(path)) {
      this.contents = value;
    } else if (this.contents == null) {
      this.contents = collectionFromPath(this.schema, Array.from(path), value);
    } else if (assertCollection(this.contents)) {
      this.contents.setIn(path, value);
    }
  }
  setSchema(version, options = {}) {
    if (typeof version === "number")
      version = String(version);
    let opt;
    switch (version) {
      case "1.1":
        if (this.directives)
          this.directives.yaml.version = "1.1";
        else
          this.directives = new Directives({ version: "1.1" });
        opt = { resolveKnownTags: false, schema: "yaml-1.1" };
        break;
      case "1.2":
      case "next":
        if (this.directives)
          this.directives.yaml.version = version;
        else
          this.directives = new Directives({ version });
        opt = { resolveKnownTags: true, schema: "core" };
        break;
      case null:
        if (this.directives)
          delete this.directives;
        opt = null;
        break;
      default: {
        const sv = JSON.stringify(version);
        throw new Error(`Expected '1.1', '1.2' or null as first argument, but found: ${sv}`);
      }
    }
    if (options.schema instanceof Object)
      this.schema = options.schema;
    else if (opt)
      this.schema = new Schema(Object.assign(opt, options));
    else
      throw new Error(`With a null YAML version, the { schema: Schema } option is required`);
  }
  toJS({ json, jsonArg, mapAsMap, maxAliasCount, onAnchor, reviver } = {}) {
    const ctx = {
      anchors: new Map,
      doc: this,
      keep: !json,
      mapAsMap: mapAsMap === true,
      mapKeyWarned: false,
      maxAliasCount: typeof maxAliasCount === "number" ? maxAliasCount : 100
    };
    const res = toJS(this.contents, jsonArg ?? "", ctx);
    if (typeof onAnchor === "function")
      for (const { count, res } of ctx.anchors.values())
        onAnchor(res, count);
    return typeof reviver === "function" ? applyReviver(reviver, { "": res }, "", res) : res;
  }
  toJSON(jsonArg, onAnchor) {
    return this.toJS({ json: true, jsonArg, mapAsMap: false, onAnchor });
  }
  toString(options = {}) {
    if (this.errors.length > 0)
      throw new Error("Document with errors cannot be stringified");
    if ("indent" in options && (!Number.isInteger(options.indent) || Number(options.indent) <= 0)) {
      const s = JSON.stringify(options.indent);
      throw new Error(`"indent" option must be a positive integer, not ${s}`);
    }
    return stringifyDocument(this, options);
  }
}
function assertCollection(contents) {
  if (isCollection(contents))
    return true;
  throw new Error("Expected a YAML collection as document contents");
}
// node_modules/.bun/yaml@2.9.1/node_modules/yaml/browser/dist/parse/cst-visit.js
var BREAK2 = Symbol("break visit");
var SKIP2 = Symbol("skip children");
var REMOVE2 = Symbol("remove item");
function visit2(cst, visitor) {
  if ("type" in cst && cst.type === "document")
    cst = { start: cst.start, value: cst.value };
  _visit(Object.freeze([]), cst, visitor);
}
visit2.BREAK = BREAK2;
visit2.SKIP = SKIP2;
visit2.REMOVE = REMOVE2;
visit2.itemAtPath = (cst, path) => {
  let item = cst;
  for (const [field, index] of path) {
    const tok = item?.[field];
    if (tok && "items" in tok) {
      item = tok.items[index];
    } else
      return;
  }
  return item;
};
visit2.parentCollection = (cst, path) => {
  const parent = visit2.itemAtPath(cst, path.slice(0, -1));
  const field = path[path.length - 1][0];
  const coll = parent?.[field];
  if (coll && "items" in coll)
    return coll;
  throw new Error("Parent collection not found");
};
function _visit(path, item, visitor) {
  let ctrl = visitor(item, path);
  if (typeof ctrl === "symbol")
    return ctrl;
  for (const field of ["key", "value"]) {
    const token = item[field];
    if (token && "items" in token) {
      for (let i = 0;i < token.items.length; ++i) {
        const ci = _visit(Object.freeze(path.concat([[field, i]])), token.items[i], visitor);
        if (typeof ci === "number")
          i = ci - 1;
        else if (ci === BREAK2)
          return BREAK2;
        else if (ci === REMOVE2) {
          token.items.splice(i, 1);
          i -= 1;
        }
      }
      if (typeof ctrl === "function" && field === "key")
        ctrl = ctrl(item, path);
    }
  }
  return typeof ctrl === "function" ? ctrl(item, path) : ctrl;
}
// node_modules/.bun/yaml@2.9.1/node_modules/yaml/browser/dist/parse/lexer.js
var hexDigits = new Set("0123456789ABCDEFabcdef");
var tagChars = new Set("0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-#;/?:@&=+$_.!~*'()");
var flowIndicatorChars = new Set(",[]{}");
var invalidAnchorChars = new Set(` ,[]{}
\r	`);
// packages/generator/src/model/categories.ts
function slugifyCategory(name) {
  return name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 50);
}
function compileCategoryDeclarations(declarations) {
  const byCode = new Map;
  let order = 0;
  for (const declaration of declarations) {
    const code = declaration.code || slugifyCategory(declaration.name);
    if (!code)
      continue;
    const existing = byCode.get(code);
    const category = {
      name: declaration.name,
      code,
      description: declaration.description || existing?.description,
      icon: declaration.icon || existing?.icon,
      color: declaration.color || existing?.color,
      seqNo: declaration.seq ?? existing?.seqNo ?? order,
      isDefault: declaration.isDefault || existing?.isDefault || false,
      entities: [...new Set([...existing?.entities ?? [], ...declaration.entities])]
    };
    if (!existing)
      order += 1;
    byCode.set(code, category);
  }
  const categories = [...byCode.values()];
  const defaults = categories.filter((category) => category.isDefault);
  if (defaults.length > 1) {
    for (const category of defaults.slice(1))
      category.isDefault = false;
  }
  return categories;
}
function resolveCategoryDeclarations(declarations, entityNames) {
  const declared = compileCategoryDeclarations(declarations);
  if (declared.length === 0) {
    return [
      {
        name: "General",
        code: "general",
        description: "Default grouping for all business entities",
        icon: "LayoutGrid",
        seqNo: 0,
        isDefault: true,
        entities: [...entityNames]
      }
    ];
  }
  const assigned = new Set(declared.flatMap((category) => category.entities));
  const unassigned = entityNames.filter((name) => !assigned.has(name));
  if (unassigned.length > 0) {
    let fallback = declared.find((category) => category.isDefault);
    if (!fallback) {
      fallback = {
        name: "General",
        code: "general",
        description: "Entities not assigned to a specific category",
        icon: "LayoutGrid",
        seqNo: declared.length,
        isDefault: true,
        entities: []
      };
      declared.push(fallback);
    }
    fallback.entities = [...new Set([...fallback.entities, ...unassigned])];
  } else if (!declared.some((category) => category.isDefault)) {
    declared[0].isDefault = true;
  }
  return declared;
}

// packages/generator/src/model/compile-erd.ts
init_utils();
var typeMap;
function typeFor(rawType) {
  typeMap ??= getTypeMap();
  return typeMap[rawType] || getDefaultType();
}
var SEMANTIC_TYPES = new Set(["email", "url", "phone", "password", "color"]);
function mergeDuplicateAttributes(attributes) {
  const byName = new Map;
  for (const attribute of attributes) {
    const existing = byName.get(attribute.name);
    if (!existing) {
      byName.set(attribute.name, { ...attribute });
      continue;
    }
    existing.required = existing.required || attribute.required;
    if (attribute.unique)
      existing.unique = true;
    if (attribute.isForeignKey)
      existing.isForeignKey = true;
    if (existing.references === undefined && attribute.references !== undefined) {
      existing.references = attribute.references;
    }
    if (existing.narrowedBy === undefined && attribute.narrowedBy !== undefined) {
      existing.narrowedBy = attribute.narrowedBy;
    }
    if (existing.maxLength === undefined && attribute.maxLength !== undefined) {
      existing.maxLength = attribute.maxLength;
    }
    if (existing.semanticType === undefined && attribute.semanticType !== undefined) {
      existing.semanticType = attribute.semanticType;
    }
    if (existing.description === undefined && attribute.description !== undefined) {
      existing.description = attribute.description;
    }
  }
  return [...byName.values()];
}
function attributeFromDeclaration(declaration) {
  const rawType = declaration.type.toLowerCase();
  const baseType = rawType.replace(/\(\d+\)$/, "");
  const modifiers = declaration.modifiers.map((m) => m.toUpperCase());
  const type = typeFor(rawType);
  const isPrimaryKey = modifiers.includes("PK");
  const isForeignKey = modifiers.includes("FK");
  const isUnique = modifiers.includes("UK") || modifiers.includes("UNIQUE");
  const isOptional = modifiers.includes("OPTIONAL") || modifiers.includes("NULL");
  const lengthMatch = declaration.type.match(/\((\d+)\)/);
  const maxLength = lengthMatch?.[1] ? parseInt(lengthMatch[1], 10) : undefined;
  return {
    name: declaration.name,
    type,
    required: !isOptional && !isPrimaryKey,
    unique: isUnique || isPrimaryKey,
    maxLength,
    ...isForeignKey && { isForeignKey: true },
    ...isForeignKey && declaration.references !== undefined && {
      references: declaration.references
    },
    ...isForeignKey && declaration.narrowedBy !== undefined && {
      narrowedBy: declaration.narrowedBy
    },
    ...SEMANTIC_TYPES.has(baseType) && {
      semanticType: baseType
    }
  };
}
function relationshipFromDeclaration(declaration) {
  const cardinality = getCardinalityKind(declaration.sourceEnd, declaration.targetEnd);
  if (!cardinality) {
    throw new Error(`Relationship ${declaration.source} → ${declaration.target} pairs ${declaration.sourceEnd} with ${declaration.targetEnd}, which the language does not define`);
  }
  const label = declaration.label?.trim();
  const name = label ? normalizeRelationshipName(label) : `${declaration.source.toLowerCase()}_${declaration.target.toLowerCase()}`;
  return {
    name,
    sourceEntity: declaration.source,
    targetEntity: declaration.target,
    cardinality,
    foreignKey: generateForeignKey(declaration.source, declaration.target, cardinality)
  };
}
function compileErdRecords(records) {
  const entities = records.entities.map((declaration) => completeEntity(declaration.name, declaration.attributes.map(attributeFromDeclaration)));
  const relationships = records.relationships.map(relationshipFromDeclaration);
  const declaredEnums = new Map;
  const enumDetails = new Map;
  for (const declared of records.enums) {
    if (!declaredEnums.has(declared.name)) {
      declaredEnums.set(declared.name, declared.values);
      enumDetails.set(declared.name, declared);
    }
  }
  const entityHelpText = new Map;
  for (const { entity, help } of records.entityHelp)
    entityHelpText.set(entity, help);
  const entityIcons = new Map;
  for (const { entity, icon } of records.entityIcons)
    entityIcons.set(entity, icon);
  const entityParents = new Map;
  for (const { entity, parent } of records.entityParents)
    entityParents.set(entity, parent);
  attachIndexes(entities, records.indexes);
  attachHelp(entities, records.fieldHelp, entityHelpText);
  for (const [name, icon] of entityIcons) {
    const entity = entities.find((candidate) => candidate.name === name);
    if (entity)
      entity.icon = icon;
  }
  for (const { entity: name, mode } of records.entityConcurrency) {
    const entity = entities.find((candidate) => candidate.name === name);
    if (entity)
      entity.concurrency = mode;
  }
  attachParents(entities, entityParents);
  for (const { entity: name, key, rows } of records.entityData) {
    const entity = entities.find((candidate) => candidate.name === name);
    if (entity)
      entity.data = { key, rows };
  }
  const enums = attachEnums(entities, declaredEnums, records.enumBindings, enumDetails);
  return { entities, relationships, enums };
}
function attachHelp(entities, fieldHelp, entityHelp) {
  for (const [name, help] of entityHelp) {
    const entity = entities.find((candidate) => candidate.name === name);
    if (entity)
      entity.description = help;
  }
  for (const { entity: name, column, help } of fieldHelp) {
    const attribute = entities.find((candidate) => candidate.name === name)?.attributes.find((candidate) => candidate.name === column);
    if (attribute)
      attribute.description = help;
  }
}
function attachParents(entities, parents) {
  for (const [childName, parentName] of parents) {
    const child = entities.find((candidate) => candidate.name === childName);
    const parent = entities.find((candidate) => candidate.name === parentName);
    if (!child || !parent)
      continue;
    const snake = snakeCase(parent.name);
    const link = child.attributes.find((a) => a.isForeignKey && a.name === `${snake}_id`) ?? child.attributes.find((a) => a.isForeignKey && a.name.startsWith(`${snake}_`)) ?? child.attributes.find((a) => a.isForeignKey && a.references === parent.name);
    if (!link)
      continue;
    child.parentEntity = parent.name;
    child.parentLinkColumn = link.name;
  }
}
function attachIndexes(entities, declared) {
  for (const { entity: entityName, columns, unique } of declared) {
    const entity = entities.find((candidate) => candidate.name === entityName);
    if (!entity)
      continue;
    const known = new Set(entity.attributes.map((attribute) => attribute.name));
    if (!columns.every((column) => known.has(column)))
      continue;
    entity.indexes = entity.indexes ?? [];
    entity.indexes.push({ columns: [...columns], unique });
  }
}
function attachEnums(entities, declared, bindings, details) {
  const used = new Set;
  for (const binding of bindings) {
    if (!declared.has(binding.enumName))
      continue;
    const entity = entities.find((candidate) => candidate.name === binding.entity);
    const attribute = entity?.attributes.find((candidate) => candidate.name === binding.column);
    if (attribute)
      used.add(binding.enumName);
  }
  const referenceIds = new Map;
  let nextId = 1000;
  for (const name of [...used].sort()) {
    referenceIds.set(name, nextId++);
  }
  for (const binding of bindings) {
    const values = declared.get(binding.enumName);
    const referenceId = referenceIds.get(binding.enumName);
    if (!values || !referenceId)
      continue;
    const entity = entities.find((candidate) => candidate.name === binding.entity);
    const attribute = entity?.attributes.find((candidate) => candidate.name === binding.column);
    if (!attribute)
      continue;
    attribute.enumRef = binding.enumName;
    attribute.enumValues = [...values];
    attribute.enumReferenceId = referenceId;
  }
  return [...referenceIds.entries()].map(([name, referenceId]) => {
    const extra = details.get(name);
    return {
      name,
      values: [...declared.get(name) ?? []],
      referenceId,
      ...extra?.table ? { table: true } : {},
      ...extra?.labels ? { labels: { ...extra.labels } } : {},
      ...extra?.descriptions ? { descriptions: { ...extra.descriptions } } : {}
    };
  });
}
function completeEntity(name, declaredAttributes) {
  if (!name) {
    throw new Error("Entity name is required");
  }
  const attributes = mergeDuplicateAttributes(declaredAttributes);
  const tableName = snakeCase(name);
  const hasIdAttribute = attributes.some((a) => a.name === "id" || a.unique && a.name.endsWith("_id"));
  if (!hasIdAttribute) {
    attributes.unshift({
      name: "id",
      type: "string",
      required: true,
      unique: true
    });
  }
  const pkAttribute = attributes.find((a) => a.unique && a.name === "id");
  const primaryKey = pkAttribute?.name || "id";
  return {
    name,
    tableName,
    description: ``,
    attributes,
    primaryKey,
    timestamps: true
  };
}
function normalizeRelationshipName(name) {
  return name.trim().replace(/\s+/g, "_").toLowerCase();
}
function generateForeignKey(sourceEntity, targetEntity, cardinality) {
  const referenced = cardinality === "oneToMany" ? sourceEntity : targetEntity;
  const cleanName = snakeCase(referenced).replace(/^bus_/, "");
  return `${cleanName}_id`;
}

// packages/generator/src/rbac/index.ts
var RBAC_OPERATIONS = ["create", "read", "update", "delete"];
var OPERATION_ALIASES2 = {
  "*": "*",
  all: "*",
  any: "*",
  create: "create",
  insert: "create",
  add: "create",
  read: "read",
  view: "read",
  select: "read",
  list: "read",
  update: "update",
  edit: "update",
  write: "update",
  modify: "update",
  delete: "delete",
  remove: "delete",
  destroy: "delete"
};
function busTableName(entity) {
  const snake = entity.replace(/([a-z0-9])([A-Z])/g, "$1_$2").replace(/([A-Z]+)([A-Z][a-z])/g, "$1_$2").toLowerCase().replace(/^_/, "");
  return snake.startsWith("bus_") || snake.startsWith("sys_") ? snake : `bus_${snake}`;
}
function compileRbacDeclarations(declarations, knownEntities = [], stateMachines = [], onWarn = () => {}) {
  const known = new Set(knownEntities);
  const operations = new Map;
  const transitions = new Map;
  const edgesFor = (entity, event) => {
    const found = [];
    for (const machine of stateMachines) {
      if (machine.entity !== entity)
        continue;
      for (const edge of machine.transitions) {
        if (!edge.trigger)
          continue;
        const normalized = edge.trigger.trim().toLowerCase().replace(/[\s-]+/g, "_");
        if (normalized === event.toLowerCase())
          found.push({ from: edge.from, to: edge.to });
      }
    }
    return found;
  };
  for (const declaration of declarations) {
    const { entity, target: rawTarget } = declaration;
    if (known.size && !known.has(entity)) {
      onWarn(`access rule on unknown entity "${entity}" — skipped.`);
      continue;
    }
    const roles = declaration.roles.filter(Boolean);
    if (roles.length === 0) {
      onWarn(`access rule on ${entity}.${rawTarget} names no role — skipped.`);
      continue;
    }
    const resolved = OPERATION_ALIASES2[rawTarget.toLowerCase()];
    if (resolved) {
      const ops = resolved === "*" ? [...RBAC_OPERATIONS] : [resolved];
      for (const operation of ops) {
        const key = `${entity}:${operation}`;
        const existing = operations.get(key);
        if (existing) {
          for (const role of roles)
            existing.roles.add(role);
        } else {
          operations.set(key, { entity, operation, roles: new Set(roles) });
        }
      }
      continue;
    }
    const edges = edgesFor(entity, rawTarget);
    if (edges.length === 0) {
      onWarn(`access rule on ${entity}.${rawTarget} names neither a CRUD operation ` + `(${RBAC_OPERATIONS.join(", ")}, *) nor a transition in ${entity}'s state machine — skipped.`);
      continue;
    }
    const key = `${entity}:${rawTarget.toLowerCase()}`;
    const existing = transitions.get(key);
    if (existing) {
      for (const role of roles)
        existing.roles.add(role);
    } else {
      transitions.set(key, { entity, transition: rawTarget, edges, roles: new Set(roles) });
    }
  }
  return {
    operations: [...operations.values()].map(({ entity, operation, roles }) => ({
      entity,
      tableName: busTableName(entity),
      operation,
      roles: [...roles].sort()
    })).sort((a, b) => a.tableName.localeCompare(b.tableName) || a.operation.localeCompare(b.operation)),
    transitions: [...transitions.values()].map(({ entity, transition, edges, roles }) => ({
      entity,
      tableName: busTableName(entity),
      transition,
      edges,
      roles: [...roles].sort()
    })).sort((a, b) => a.tableName.localeCompare(b.tableName) || a.transition.localeCompare(b.transition))
  };
}

// packages/generator/src/reports/index.ts
var REPORT_CHART_TYPES = ["bar", "line", "pie", "area"];
var CHART_TYPE_SET = new Set(REPORT_CHART_TYPES);
var READ_ONLY = /^\s*(?:with|select)\b/i;
function hasStatementBreak(sql) {
  const body = sql.replace(/;\s*$/, "");
  let quote = null;
  for (let i = 0;i < body.length; i++) {
    const ch = body[i];
    if (quote) {
      if (ch === quote) {
        if (body[i + 1] === quote)
          i += 1;
        else
          quote = null;
      }
      continue;
    }
    if (ch === "'" || ch === '"')
      quote = ch;
    else if (ch === ";")
      return true;
  }
  return false;
}
function validateReportDeclaration(declaration) {
  const { name, sql } = declaration;
  if (!READ_ONLY.test(sql))
    return { error: `sql: is not a SELECT or WITH query` };
  if (hasStatementBreak(sql))
    return { error: `sql: contains more than one statement` };
  const chartRaw = declaration.chart;
  if (chartRaw && !CHART_TYPE_SET.has(chartRaw)) {
    return { error: `has unknown chart type "${chartRaw}"` };
  }
  const chart = chartRaw;
  const x = declaration.x;
  const y = declaration.y;
  if (chart && (!x || !y)) {
    return { error: `declares chart: ${chart} but not both x: and y:` };
  }
  return {
    name,
    title: declaration.title ?? name.replace(/[_-]+/g, " "),
    entity: declaration.entity,
    chart,
    x,
    y,
    help: declaration.help,
    sql
  };
}
function compileReportDeclarations(declarations, entityNames, warn = () => {}) {
  const accumulator = reportAccumulator(entityNames, warn);
  for (const declaration of declarations)
    accumulator.add(declaration, `report ${declaration.name}`);
  return accumulator.reports();
}
function reportAccumulator(entityNames, warn) {
  const known = new Set(entityNames);
  const byName = new Map;
  return {
    add(declaration, context) {
      const parsed = validateReportDeclaration(declaration);
      if ("error" in parsed) {
        warn(`${context} ${parsed.error} — skipped`);
        return;
      }
      if (byName.has(parsed.name)) {
        warn(`report "${parsed.name}" is declared more than once — keeping the first`);
        return;
      }
      if (parsed.entity && !known.has(parsed.entity)) {
        warn(`report "${parsed.name}" names entity "${parsed.entity}", which the model does not declare — ungrouped`);
        parsed.entity = undefined;
      }
      byName.set(parsed.name, parsed);
    },
    reports() {
      return [...byName.values()];
    }
  };
}

// packages/generator/src/rules/jdm-converter.ts
var JDM_NODE_TYPE = {
  start: "inputNode",
  end: "outputNode",
  decision: "switchNode",
  expression: "expressionNode",
  function: "functionNode"
};
function ruleGraphToJdm(nodes, edges) {
  let edgeCounter = 0;
  return {
    nodes: nodes.map((node) => ({
      id: `node-${node.id}`,
      name: node.label,
      type: JDM_NODE_TYPE[node.type]
    })),
    edges: edges.map((edge) => ({
      id: `edge-${++edgeCounter}`,
      name: edge.label,
      sourceId: `node-${edge.source}`,
      targetId: `node-${edge.target}`
    }))
  };
}
// packages/generator/src/rules/index.ts
function eventToOperation(event) {
  const normalized = event.toLowerCase();
  if (normalized.includes("create"))
    return "CREATE";
  if (normalized.includes("update"))
    return "UPDATE";
  if (normalized.includes("delete"))
    return "DELETE";
  return "ALL";
}
function toTableName(entity) {
  const snake = entity.replace(/([a-z0-9])([A-Z])/g, "$1_$2").replace(/([A-Z]+)([A-Z][a-z])/g, "$1_$2").toLowerCase();
  return snake.startsWith("bus_") || snake.startsWith("sys_") ? snake : `bus_${snake}`;
}
function withDefaultCondition(action) {
  return { name: action.name, type: action.type, when: action.when ?? "true", props: action.props };
}
function zenLiteral(value) {
  return `'${value.replace(/'/g, "\\'")}'`;
}
function isBareLiteral(value) {
  return value === "true" || value === "false" || value === "null" || value !== "" && !Number.isNaN(Number(value));
}
function isQuoted(value) {
  return value.length >= 2 && (value.startsWith("'") || value.startsWith('"')) && value.endsWith(value[0]);
}
function zenCell(raw) {
  const value = (raw ?? "").trim();
  if (value === "")
    return "";
  if (isQuoted(value) || isBareLiteral(value))
    return value;
  return zenLiteral(value);
}
function zenInputCell(raw) {
  const value = (raw ?? "").trim();
  if (value === "")
    return "";
  const match = value.match(/^(>=|<=|!=|=|>|<)\s*(.*)$/);
  if (!match)
    return zenCell(value);
  const [, operator, operand] = match;
  const cell = zenCell(operand);
  if (!cell)
    return "";
  return operator === "=" ? cell : `${operator} ${cell}`;
}
function buildEditorDecisionTable(ruleName, table) {
  const inputs = (table.inputs ?? []).filter((column) => (column.field ?? "").trim() !== "");
  const outputs = (table.outputs ?? []).filter((column) => (column.field ?? "").trim() !== "");
  const rows = (table.rules ?? []).map((row, index) => {
    const compiled = { _id: row._id || `${ruleName}-${index + 1}` };
    for (const column of inputs)
      compiled[column.id] = zenInputCell(row[column.id]);
    for (const column of outputs)
      compiled[column.id] = zenCell(row[column.id]);
    return compiled;
  });
  const tableId = `${ruleName}-table`;
  return {
    nodes: [
      { id: "input", name: "Input", type: "inputNode" },
      {
        id: tableId,
        name: ruleName,
        type: "decisionTableNode",
        content: {
          hitPolicy: table.hitPolicy === "collect" ? "collect" : "first",
          inputs: inputs.map((column) => ({
            id: column.id,
            name: column.name ?? column.id,
            field: column.field ?? ""
          })),
          outputs: outputs.map((column) => ({
            id: column.id,
            name: column.name ?? column.id,
            field: column.field ?? ""
          })),
          rules: rows
        }
      },
      { id: "output", name: "Output", type: "outputNode" }
    ],
    edges: [
      { id: "edge-1", sourceId: "input", targetId: tableId },
      { id: "edge-2", sourceId: tableId, targetId: "output" }
    ]
  };
}
var RUNTIME_ACTION = {
  "validation-error": "prevent"
};
function transformDataCell(action) {
  const field = (action.props.field ?? "").trim();
  if (action.type !== "transform" || !field)
    return zenLiteral("");
  return zenLiteral(JSON.stringify({ [field]: action.props.value ?? "" }));
}
function buildActionDecisionTable(ruleName, actions) {
  const cells = [
    (action) => zenLiteral(RUNTIME_ACTION[action.type] ?? action.type),
    (action) => zenLiteral(action.props.message ?? `${ruleName}: ${action.name}`),
    () => zenLiteral(ruleName),
    (action) => zenLiteral(action.props.workflow ?? ""),
    (action) => zenLiteral(action.props.targetEntity ?? ""),
    (action) => zenLiteral(action.props.linkField ?? ""),
    (action) => zenLiteral(action.props.updateData ?? ""),
    (action) => zenLiteral(action.props.createData ?? ""),
    transformDataCell
  ];
  const rows = actions.map((action) => {
    const row = {
      _id: `${ruleName}-${action.name}`,
      i1: action.when
    };
    cells.forEach((cell, index) => {
      row[`o${index + 1}`] = cell(action);
    });
    return row;
  });
  return {
    nodes: [
      { id: "input", name: "Input", type: "inputNode" },
      {
        id: `${ruleName}-table`,
        name: ruleName,
        type: "decisionTableNode",
        content: {
          hitPolicy: "collect",
          inputs: [{ id: "i1", name: "Record", field: "" }],
          outputs: [
            { id: "o1", name: "Action", field: "action" },
            { id: "o2", name: "Message", field: "message" },
            { id: "o3", name: "Rule ID", field: "ruleId" },
            { id: "o4", name: "Workflow Name", field: "workflowName" },
            { id: "o5", name: "Target Entity", field: "targetEntity" },
            { id: "o6", name: "Link Field", field: "linkField" },
            { id: "o7", name: "Update Data", field: "updateData" },
            { id: "o8", name: "Create Data", field: "createData" },
            { id: "o9", name: "Transform Data", field: "transformData" }
          ],
          rules: rows
        }
      },
      { id: "output", name: "Output", type: "outputNode" }
    ],
    edges: [
      { id: "edge-1", sourceId: "input", targetId: `${ruleName}-table` },
      { id: "edge-2", sourceId: `${ruleName}-table`, targetId: "output" }
    ]
  };
}
function compileRuleDeclarations(declarations, onWarn = () => {}) {
  const compiled = [];
  for (const declaration of declarations) {
    if (!declaration.entity) {
      onWarn(`Rule "${declaration.name}" declares no entity; skipping.`);
      continue;
    }
    try {
      const editorTable = declaration.decisionTable ?? null;
      if (!editorTable && !declaration.nodes.length) {
        onWarn(`Rule "${declaration.name}" has no nodes; skipping.`);
        continue;
      }
      let jdm;
      if (editorTable) {
        jdm = buildEditorDecisionTable(declaration.name, editorTable);
      } else if (declaration.actions.length) {
        jdm = buildActionDecisionTable(declaration.name, declaration.actions.map(withDefaultCondition));
      } else {
        jdm = ruleGraphToJdm(declaration.nodes, declaration.edges);
      }
      compiled.push({
        name: declaration.name,
        entity: declaration.entity,
        tableName: toTableName(declaration.entity),
        event: declaration.event,
        operation: eventToOperation(declaration.event),
        priority: declaration.priority ?? 100,
        jdmContent: JSON.stringify(jdm)
      });
    } catch (error) {
      onWarn(`Rule "${declaration.name}" could not be compiled: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  return compiled;
}

// packages/generator/src/workflows/state-machine.ts
function toTableName2(entity) {
  const snake = entity.replace(/([a-z0-9])([A-Z])/g, "$1_$2").replace(/([A-Z]+)([A-Z][a-z])/g, "$1_$2").toLowerCase();
  return snake.startsWith("bus_") || snake.startsWith("sys_") ? snake : `bus_${snake}`;
}
function compileStateMachineDeclarations(declarations, knownEntities = [], onWarn = () => {}) {
  const known = new Set(knownEntities);
  const compiled = [];
  for (const declaration of declarations) {
    if (known.size && !known.has(declaration.entity)) {
      onWarn(`Workflow "${declaration.name}" targets unknown entity "${declaration.entity}" — skipped.`);
      continue;
    }
    if (!declaration.states.length) {
      onWarn(`Workflow "${declaration.name}" declares no states — skipped.`);
      continue;
    }
    if (!declaration.initial) {
      onWarn(`Workflow "${declaration.name}" has no starting state — records will not be stamped.`);
    }
    compiled.push({
      name: declaration.name,
      entity: declaration.entity,
      tableName: toTableName2(declaration.entity),
      states: declaration.states.map((name) => ({ name })),
      transitions: declaration.transitions.map(({ from, to, trigger }) => ({ from, to, trigger })),
      initial: declaration.initial,
      terminal: [...declaration.final]
    });
  }
  return compiled;
}

// packages/generator/src/model/compile.ts
function compileModelRecords(records, options = {}) {
  const warn = options.warn ?? (() => {});
  const { entities, relationships, enums } = compileErdRecords(records.erd);
  const entityNames = entities.map((entity) => entity.name);
  const categories = resolveCategoryDeclarations(records.categories, entityNames);
  const { workflows: sagas, diagnostics: sagaDiagnostics } = compileSagaDeclarations(records.sagas);
  for (const diagnostic of sagaDiagnostics) {
    const where = diagnostic.nodeId ? `${diagnostic.workflow}.${diagnostic.nodeId}` : diagnostic.workflow;
    warn(`saga ${where}: ${diagnostic.message}`);
  }
  const workflows = compileStateMachineDeclarations(records.stateMachines, entityNames, warn);
  const rbac = compileRbacDeclarations(records.rbac, entityNames, workflows, warn);
  const rules = compileRuleDeclarations(records.rules, warn);
  const hooks = compileHookDeclarations(records.hooks, entityNames, warn);
  const reports = compileReportDeclarations(records.reports, entityNames, warn);
  return {
    entities,
    relationships,
    categories,
    enums,
    sagas,
    rbac,
    rules,
    hooks,
    reports,
    workflows,
    description: records.description
  };
}

// packages/generator/src/model-yaml/canonical.ts
function present(key, value) {
  return value === undefined ? {} : { [key]: value };
}
function nonEmpty(key, list) {
  return list?.length ? { [key]: list } : {};
}
function titleOf(title, name) {
  return title !== undefined && title !== name ? { title } : {};
}
function attributeOf(attribute) {
  return {
    name: attribute.name,
    type: attribute.type,
    ...attribute.pk ? { pk: true } : {},
    ...attribute.fk ? { fk: true } : {},
    ...present("references", attribute.references),
    ...present("narrowedBy", attribute.narrowedBy),
    ...attribute.unique ? { unique: true } : {},
    ...attribute.optional ? { optional: true } : {},
    ...present("enum", attribute.enum),
    ...present("help", attribute.help),
    ...present("ui", attribute.ui),
    ...present("default", attribute.default),
    ...present("min", attribute.min),
    ...present("max", attribute.max),
    ...present("format", attribute.format),
    ...present("comment", attribute.comment)
  };
}
function entityOf(entity) {
  return {
    name: entity.name,
    ...present("help", entity.help),
    ...present("icon", entity.icon),
    ...present("parent", entity.parent),
    ...present("concurrency", entity.concurrency),
    ...present("label", entity.label),
    ...present("prefix", entity.prefix),
    ...present("softDelete", entity.softDelete),
    ...present("audited", entity.audited),
    ...present("data", entity.data),
    attributes: entity.attributes.map(attributeOf),
    ...nonEmpty("indexes", entity.indexes?.map((index) => ({
      columns: [...index.columns],
      ...index.unique ? { unique: true } : {}
    })))
  };
}
function enumsOf(enums) {
  if (!enums)
    return;
  const seen = new Set;
  return enums.filter((declared) => !seen.has(declared.name) && seen.add(declared.name)).map((declared) => ({
    name: declared.name,
    values: [...declared.values],
    ...declared.table ? { table: true } : {},
    ...declared.labels && Object.keys(declared.labels).length ? { labels: { ...declared.labels } } : {},
    ...declared.descriptions && Object.keys(declared.descriptions).length ? { descriptions: { ...declared.descriptions } } : {}
  }));
}
function categoryOf(category) {
  return {
    name: category.name,
    ...present("code", category.code),
    ...present("description", category.description),
    ...present("icon", category.icon),
    ...present("color", category.color),
    ...present("seq", category.seq),
    ...category.default ? { default: true } : {},
    ...nonEmpty("entities", category.entities && [...category.entities])
  };
}
function reportOf(report) {
  return {
    name: report.name,
    ...present("title", report.title),
    ...present("entity", report.entity),
    ...present("chart", report.chart),
    ...present("x", report.x),
    ...present("y", report.y),
    ...present("help", report.help),
    sql: report.sql
  };
}
function edgesOf(edges) {
  return edges.map((edge) => ({ from: edge.from, to: edge.to, ...present("label", edge.label) }));
}
function ruleOf(rule) {
  return {
    name: rule.name,
    ...titleOf(rule.title, rule.name),
    entity: rule.entity,
    event: rule.event,
    ...present("priority", rule.priority),
    ...rule.direction !== undefined && rule.direction !== "down" ? { direction: rule.direction } : {},
    nodes: rule.nodes.map((node) => ({ id: node.id, label: node.label, type: node.type })),
    edges: edgesOf(rule.edges),
    ...nonEmpty("actions", rule.actions?.map((action) => ({
      name: action.name,
      type: action.type,
      ...present("when", action.when),
      ...action.props && Object.keys(action.props).length ? { props: { ...action.props } } : {}
    }))),
    ...present("decisionTable", rule.decisionTable)
  };
}
function stateMachineOf(machine) {
  return {
    name: machine.name,
    ...titleOf(machine.title, machine.name),
    entity: machine.entity,
    states: [...machine.states],
    ...present("initial", machine.initial),
    ...nonEmpty("final", machine.final && [...machine.final]),
    transitions: machine.transitions.map((transition) => ({
      from: transition.from,
      to: transition.to,
      ...present("trigger", transition.trigger)
    }))
  };
}
function sagaOf(saga) {
  const operation = sagaOperation(saga.operation);
  const trigger = sagaTrigger(saga.trigger);
  return {
    name: saga.name,
    ...titleOf(saga.title, saga.name),
    entity: saga.entity,
    ...operation !== "CREATE" ? { operation } : {},
    ...trigger !== "automatic" ? { trigger } : {},
    ...present("description", saga.description),
    steps: saga.steps.map((step) => ({
      id: step.id,
      type: step.type,
      ...step.label !== undefined && step.label !== step.id ? { label: step.label } : {},
      ...step.properties && Object.keys(step.properties).length ? { properties: { ...step.properties } } : {}
    }))
  };
}
function hookFlowOf(flow) {
  return {
    name: flow.name,
    ...titleOf(flow.title, flow.name),
    entity: flow.entity,
    ...flow.direction !== undefined && flow.direction !== "down" ? { direction: flow.direction } : {},
    nodes: flow.nodes.map((node) => ({
      id: node.id,
      ...present("label", node.label),
      ...present("event", node.event),
      ...present("handler", node.handler)
    })),
    edges: edgesOf(flow.edges)
  };
}
function canonicalDocument(document) {
  return {
    eml: document.eml,
    ...present("name", document.name),
    ...present("version", document.version),
    ...present("description", document.description),
    ...nonEmpty("enums", enumsOf(document.enums)),
    ...nonEmpty("categories", document.categories?.map(categoryOf)),
    entities: document.entities.map(entityOf),
    ...nonEmpty("relationships", document.relationships?.map((relationship) => ({
      from: relationship.from,
      fromCardinality: relationship.fromCardinality,
      to: relationship.to,
      toCardinality: relationship.toCardinality,
      ...present("label", relationship.label)
    }))),
    ...nonEmpty("hooks", document.hooks?.map((hook) => ({
      entity: hook.entity,
      event: hook.event,
      handler: hook.handler,
      ...nonEmpty("fields", hook.fields && [...hook.fields])
    }))),
    ...nonEmpty("hookFlows", document.hookFlows?.map(hookFlowOf)),
    ...nonEmpty("rbac", document.rbac?.map((rule) => ({
      entity: rule.entity,
      action: rule.action,
      roles: [...rule.roles]
    }))),
    ...nonEmpty("triggers", document.triggers?.map((trigger) => ({
      entity: trigger.entity,
      source: trigger.source,
      handler: trigger.handler
    }))),
    ...nonEmpty("reports", document.reports?.map(reportOf)),
    ...nonEmpty("rules", document.rules?.map(ruleOf)),
    ...nonEmpty("stateMachines", document.stateMachines?.map(stateMachineOf)),
    ...nonEmpty("sagas", document.sagas?.map(sagaOf))
  };
}

// packages/generator/src/model/records.ts
var ENTITY_OPTION_KEYS = ["label", "prefix", "softDelete", "audited"];
var FIELD_OPTION_KEYS = ["ui", "default", "min", "max", "format"];

// packages/generator/src/model-yaml/to-records.ts
function modifiersOf(attribute) {
  const modifiers = [];
  if (attribute.pk)
    modifiers.push("PK");
  if (attribute.fk)
    modifiers.push("FK");
  if (attribute.unique)
    modifiers.push("UK");
  if (attribute.optional)
    modifiers.push("OPTIONAL");
  if (attribute.comment !== undefined)
    modifiers.push(`"${attribute.comment}"`);
  return modifiers;
}
function erdOf(document) {
  const erd = {
    entities: [],
    relationships: [],
    indexes: [],
    enums: (document.enums ?? []).map((declared) => ({
      name: declared.name,
      values: [...declared.values],
      ...declared.table ? { table: true } : {},
      ...declared.labels ? { labels: { ...declared.labels } } : {},
      ...declared.descriptions ? { descriptions: { ...declared.descriptions } } : {}
    })),
    enumBindings: [],
    fieldHelp: [],
    entityHelp: [],
    entityIcons: [],
    entityConcurrency: [],
    entityData: [],
    entityParents: [],
    entityOptions: [],
    fieldOptions: []
  };
  for (const entity of document.entities) {
    erd.entities.push({
      name: entity.name,
      attributes: entity.attributes.map((attribute) => ({
        type: attribute.type,
        name: attribute.name,
        modifiers: modifiersOf(attribute),
        ...attribute.references !== undefined ? { references: attribute.references } : {},
        ...attribute.narrowedBy !== undefined ? { narrowedBy: attribute.narrowedBy } : {}
      }))
    });
    if (entity.help !== undefined)
      erd.entityHelp.push({ entity: entity.name, help: entity.help });
    if (entity.icon !== undefined)
      erd.entityIcons.push({ entity: entity.name, icon: entity.icon });
    if (entity.concurrency !== undefined) {
      erd.entityConcurrency.push({ entity: entity.name, mode: entity.concurrency });
    }
    if (entity.data !== undefined)
      erd.entityData.push({ entity: entity.name, ...entity.data });
    if (entity.parent !== undefined) {
      erd.entityParents.push({ entity: entity.name, parent: entity.parent });
    }
    for (const key of ENTITY_OPTION_KEYS) {
      const value = entity[key];
      if (value !== undefined) {
        erd.entityOptions.push({ entity: entity.name, key, value: String(value) });
      }
    }
    for (const attribute of entity.attributes) {
      if (attribute.enum !== undefined) {
        erd.enumBindings.push({
          entity: entity.name,
          column: attribute.name,
          enumName: attribute.enum
        });
      }
      for (const key of FIELD_OPTION_KEYS) {
        const value = attribute[key];
        if (value !== undefined) {
          erd.fieldOptions.push({
            entity: entity.name,
            column: attribute.name,
            key,
            value: String(value)
          });
        }
      }
      if (attribute.help !== undefined) {
        erd.fieldHelp.push({ entity: entity.name, column: attribute.name, help: attribute.help });
      }
    }
    for (const index of entity.indexes ?? []) {
      erd.indexes.push({
        entity: entity.name,
        columns: [...index.columns],
        unique: index.unique === true
      });
    }
  }
  erd.relationships = (document.relationships ?? []).map((relationship) => ({
    source: relationship.from,
    target: relationship.to,
    sourceEnd: relationship.fromCardinality,
    targetEnd: relationship.toCardinality,
    ...relationship.label !== undefined ? { label: relationship.label } : {}
  }));
  return erd;
}
function categoryOf2(category) {
  return {
    name: category.name,
    ...category.code !== undefined ? { code: category.code } : {},
    ...category.description !== undefined ? { description: category.description } : {},
    ...category.icon !== undefined ? { icon: category.icon } : {},
    ...category.color !== undefined ? { color: category.color } : {},
    ...category.seq !== undefined ? { seq: category.seq } : {},
    isDefault: category.default === true,
    entities: [...category.entities ?? []]
  };
}
function ruleOf2(rule) {
  return {
    name: rule.name,
    ...rule.title !== undefined ? { title: rule.title } : {},
    entity: rule.entity,
    event: rule.event,
    ...rule.priority !== undefined ? { priority: rule.priority } : {},
    ...rule.direction !== undefined ? { direction: rule.direction } : {},
    nodes: rule.nodes.map((node) => ({ id: node.id, label: node.label, type: node.type })),
    edges: rule.edges.map((edge) => ({
      source: edge.from,
      target: edge.to,
      ...edge.label !== undefined ? { label: edge.label } : {}
    })),
    actions: (rule.actions ?? []).map((action) => ({
      name: action.name,
      type: action.type,
      ...action.when !== undefined ? { when: action.when } : {},
      props: { ...action.props ?? {} }
    })),
    ...rule.decisionTable !== undefined ? { decisionTable: rule.decisionTable } : {}
  };
}
function stateMachineOf2(machine) {
  return {
    name: machine.name,
    ...machine.title !== undefined ? { title: machine.title } : {},
    entity: machine.entity,
    states: [...machine.states],
    ...machine.initial !== undefined ? { initial: machine.initial } : {},
    final: [...machine.final ?? []],
    transitions: machine.transitions.map((transition) => ({ ...transition }))
  };
}
function hookFlowOf2(flow) {
  return {
    name: flow.name,
    ...flow.title !== undefined ? { title: flow.title } : {},
    entity: flow.entity,
    ...flow.direction !== undefined ? { direction: flow.direction } : {},
    nodes: flow.nodes.map((node) => ({ ...node })),
    edges: flow.edges.map((edge) => ({
      source: edge.from,
      target: edge.to,
      ...edge.label !== undefined ? { label: edge.label } : {}
    }))
  };
}
function sagaOf2(saga) {
  return {
    name: saga.name,
    ...saga.title !== undefined ? { title: saga.title } : {},
    entity: saga.entity,
    ...saga.operation !== undefined ? { operation: saga.operation } : {},
    ...saga.trigger !== undefined ? { trigger: saga.trigger } : {},
    ...saga.description !== undefined ? { description: saga.description } : {},
    steps: saga.steps.map((step) => ({
      id: step.id,
      type: step.type,
      ...step.label !== undefined ? { label: step.label } : {},
      properties: { ...step.properties ?? {} }
    }))
  };
}
function documentToRecords(document) {
  return {
    ...document.name !== undefined ? { name: document.name } : {},
    ...document.version !== undefined ? { version: document.version } : {},
    ...document.description !== undefined ? { description: document.description } : {},
    erd: erdOf(document),
    categories: (document.categories ?? []).map(categoryOf2),
    rbac: (document.rbac ?? []).map((rule) => ({
      roles: [...rule.roles],
      entity: rule.entity,
      target: rule.action
    })),
    triggers: (document.triggers ?? []).map((trigger) => ({
      source: trigger.source,
      handler: trigger.handler,
      entity: trigger.entity
    })),
    hooks: (document.hooks ?? []).map((hook) => ({
      event: hook.event,
      handler: hook.handler,
      entity: hook.entity,
      ...hook.fields?.length ? { fields: [...hook.fields] } : {}
    })),
    reports: (document.reports ?? []).map((report) => ({ ...report })),
    rules: (document.rules ?? []).map(ruleOf2),
    stateMachines: (document.stateMachines ?? []).map(stateMachineOf2),
    sagas: (document.sagas ?? []).map(sagaOf2),
    hookFlows: (document.hookFlows ?? []).map(hookFlowOf2)
  };
}
// packages/generator/src/model-yaml/fixer.ts
var AUTO_FIXABLE_CODES = new Set([
  "EML001",
  "EML103",
  "EML112",
  "EML114",
  "EML117",
  "EML287",
  "EML421",
  "EML422"
]);
// packages/generator/src/model-yaml/index.ts
function serializeModelDocument(document) {
  const yaml = new Document(canonicalDocument(document));
  visit(yaml, {
    Seq(_key, node) {
      if (node.items.length && node.items.every((item) => isScalar(item)))
        node.flow = true;
    }
  });
  return yaml.toString({
    lineWidth: 0,
    blockQuote: "literal",
    indentSeq: true,
    flowCollectionPadding: false
  });
}
function compileModelDocument(document, options = {}) {
  return compileModelRecords(documentToRecords(document), options);
}

// packages/generator/src/pipeline/cedm-bundle.ts
init_fs();
init_path();

// packages/generator/src/model-cedm/library.ts
init_fs();
init_path();
var MARKER = path_default.join("specification", "manifest.yaml");
function walkUp(start) {
  let directory = path_default.resolve(start);
  for (;; ) {
    if (existsSync(path_default.join(directory, MARKER)) && existsSync(path_default.join(directory, "domain"))) {
      return directory;
    }
    const parent = path_default.dirname(directory);
    if (parent === directory)
      return;
    directory = parent;
  }
}
function locateCedmRoot(near) {
  const fromEnvironment = "/";
  if (fromEnvironment && existsSync(path_default.join(fromEnvironment, MARKER))) {
    return path_default.resolve(fromEnvironment);
  }
  const candidates = [near, process.cwd()];
  try {
    candidates.push(path_default.dirname(fileURLToPath(import.meta.url)));
  } catch {}
  for (const candidate of candidates) {
    if (!candidate)
      continue;
    const found = walkUp(candidate);
    if (found)
      return found;
  }
  return;
}
var entityCache = new Map;

// packages/generator/src/pipeline/cedm-bundle.ts
var COMMON_CEDM_DIRECTORIES = ["specification", "schema", "domains"];
async function copyYamlDirectory(from, to) {
  if (!existsSync(from))
    return [];
  const copied = [];
  await mkdir2(to, { recursive: true });
  for (const entry of (await readdir2(from)).sort()) {
    if (!/\.ya?ml$/.test(entry))
      continue;
    await copyFile2(join(from, entry), join(to, entry));
    copied.push(entry);
  }
  return copied;
}
var README = (sections) => `# CEDM specification

This application was generated from a model built on CEDM, the Common
Enterprise Domain Model. The files here are the specification it was built
against, bundled into every generated application so the contract travels
with the code:

${sections.join(`
`)}

Nothing in the application reads these files at run time. The model itself is
in \`../model/\`.
`;
async function writeCedmBundle(outputDir, source) {
  const root = source?.root ?? locateCedmRoot();
  if (!root)
    return [];
  const target = join(outputDir, "cedm");
  const written = [];
  try {
    await rm2(target, { recursive: true, force: true });
    const sections = [];
    for (const directory of COMMON_CEDM_DIRECTORIES) {
      const files = await copyYamlDirectory(join(root, directory), join(target, directory));
      written.push(...files.map((file) => join(directory, file)));
    }
    sections.push("- `specification/` — vocabulary, lifecycle, business-rule, authorization, reporting and generation semantics, and the application profile", "- `schema/` — the shape of a CEDM entity", "- `domains/` — the domain and capability catalogs");
    if (source?.libraryFiles.length) {
      await mkdir2(join(target, "entities"), { recursive: true });
      for (const file of [...source.libraryFiles].sort()) {
        const name = basename(file);
        await copyFile2(join(root, file), join(target, "entities", name));
        written.push(join("entities", name));
      }
      sections.push("- `entities/` — the library entity definitions this application imports");
    }
    if (source?.moduleFiles.length) {
      await mkdir2(join(target, "applications"), { recursive: true });
      for (const file of [...source.moduleFiles].sort()) {
        const name = basename(file);
        await copyFile2(file, join(target, "applications", name));
        written.push(join("applications", name));
      }
      sections.push("- `applications/` — the application modules the model imports");
    }
    await writeFile2(join(target, "README.md"), README(sections), "utf-8");
    written.push("README.md");
  } catch {}
  return written;
}

// packages/generator/src/pipeline/chat-bundle.ts
init_fs();
init_path();

// packages/generator/src/chat/domain-skill.ts
init_types2();

// packages/generator/src/naming/tables.ts
init_types2();
function tableNameFor2(entity) {
  if (entity.tableName?.startsWith("sys_"))
    return entity.tableName;
  return entityToBusEntity(entity).tableName;
}

// packages/generator/src/chat/domain-skill.ts
var title2 = (value) => formatDisplayName(String(value));
function domainSkillName(projectName) {
  const base = projectName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return `${base || "application"}-domain`;
}
function prose(value, limit = 400) {
  const text = String(value ?? "").replace(/\s+/g, " ").replace(/`{3,}/g, "``").replace(/^#+\s*/, "").trim();
  return text.length > limit ? `${text.slice(0, limit - 1).trimEnd()}…` : text;
}
var SYSTEM_COLUMNS = new Set([
  "id",
  "version",
  "created_at",
  "updated_at",
  "created_by",
  "updated_by",
  "deleted_at",
  "deleted_by"
]);
function referenceNamer(model) {
  const byTable = new Map(model.entities.map((entity) => [tableNameFor2(entity), entity.name]));
  const byName = new Map(model.entities.map((entity) => [entity.name, tableNameFor2(entity)]));
  const tables = new Set(byTable.keys());
  return (attribute) => {
    const explicit = attribute.references ? byName.get(attribute.references) : undefined;
    const table = foreignKeyTargetTable(attribute.name, tables, explicit);
    return table ? byTable.get(table) ?? null : null;
  };
}
function fieldLines(entity, enums, target) {
  return entity.attributes.filter((attribute) => !SYSTEM_COLUMNS.has(attribute.name) && attribute.name !== entity.primaryKey).map((attribute) => {
    const parts = [`  - **${title2(attribute.name.replace(/_id$/, ""))}**`];
    const notes = [];
    if (attribute.required)
      notes.push("required");
    if (attribute.isForeignKey) {
      const points = target(attribute);
      if (points)
        notes.push(`a ${title2(points)}`);
    }
    const list = attribute.enumRef ? enums.get(attribute.enumRef) : undefined;
    if (list)
      notes.push(`one of the ${title2(list.name)} values`);
    if (notes.length)
      parts.push(` (${notes.join(", ")})`);
    const help = prose(attribute.description, 240);
    if (help)
      parts.push(` — ${help}`);
    return parts.join("");
  });
}
function enumSection(enums) {
  if (enums.length === 0)
    return [];
  const lines = ["## Value lists", ""];
  for (const list of [...enums].sort((a, b) => a.name.localeCompare(b.name))) {
    lines.push(`### ${title2(list.name)}`, "");
    for (const value of list.values) {
      const label = list.labels?.[value] ?? title2(value);
      const meaning = prose(list.descriptions?.[value], 240);
      lines.push(`- **${label}**${meaning ? ` — ${meaning}` : ""}`);
    }
    lines.push("");
  }
  return lines;
}
function renderDomainSkill(model, options) {
  const name = domainSkillName(options.projectName);
  const application = title2(options.projectName);
  const access = deriveAccess(model.rbac, {
    projectId: options.projectName,
    entities: model.entities.map((entity) => entity.name)
  });
  const enums = new Map(model.enums.map((list) => [list.name, list]));
  const target = referenceNamer(model);
  const children = new Map;
  for (const entity of model.entities) {
    if (!entity.parentEntity)
      continue;
    const list = children.get(entity.parentEntity) ?? [];
    list.push(entity);
    children.set(entity.parentEntity, list);
  }
  const declared = new Set(model.entities.map((entity) => entity.name));
  const windows = model.entities.filter((entity) => !entity.parentEntity || !declared.has(entity.parentEntity));
  const lines = [
    "---",
    `name: ${name}`,
    `description: What the records of ${application} are, what their statuses mean, which statuses are final, who may read and move them, and which reports answer which questions.`,
    `whenToUse: Before searching, opening or explaining any record of ${application}, and whenever the person uses a term of the business — a record type, a status, a role or a report.`,
    "---",
    "",
    `# ${application}`,
    ""
  ];
  const overview = prose(model.description, 1200);
  if (overview)
    lines.push(overview, "");
  lines.push("Everything below is the application's own description of itself, taken from the model it was generated from. Use these names when you talk to the person, and pass the record type's name as `entity` to the tools.", "");
  lines.push("## Records", "");
  for (const entity of [...windows].sort((a, b) => a.name.localeCompare(b.name))) {
    lines.push(`### ${title2(entity.name)}`, "");
    const help = prose(entity.description, 600);
    if (help)
      lines.push(help, "");
    const readers = access.entityVisibility[entity.name];
    lines.push(readers && readers.length > 0 ? `Readable by: ${readers.map(title2).join(", ")}, and the Administrator. Anyone else does not see it at all.` : "Readable by every signed-in person.", "");
    const writes = model.rbac.operations.filter((rule) => rule.entity === entity.name && rule.operation !== "read");
    for (const rule of writes) {
      lines.push(`- ${title2(rule.operation)} only by: ${rule.roles.map(title2).join(", ")}`);
    }
    if (writes.length)
      lines.push("");
    if (entity.concurrency === "last-write-wins") {
      lines.push("When two people save the same record, the later save replaces the earlier one: this record type is last-write-wins, so no conflict is reported.", "");
    }
    lines.push("Fields:", ...fieldLines(entity, enums, target), "");
    for (const child of children.get(entity.name) ?? []) {
      lines.push(`Line items — **${title2(child.name)}**: kept inside each ${title2(entity.name)} and reached by opening it, never on their own.${child.description ? ` ${prose(child.description, 300)}` : ""}`, "");
    }
  }
  lines.push(...enumSection(model.enums));
  if (model.workflows.length > 0) {
    lines.push("## Lifecycles", "");
    lines.push("A record with a lifecycle moves only along the moves listed — the application refuses any other, for every role. A **final** state is a completed transaction: the application refuses every change to such a record and every deletion of it, including an administrator's. Say so when a record is final.", "");
    for (const workflow of model.workflows) {
      lines.push(`### ${title2(workflow.entity)} — ${title2(workflow.name)}`, "");
      if (workflow.initial)
        lines.push(`Starts at **${title2(workflow.initial)}**.`);
      if (workflow.terminal.length) {
        lines.push(`Final: ${workflow.terminal.map((state) => `**${title2(state)}**`).join(", ")}.`);
      }
      lines.push("", "Moves:");
      for (const move of workflow.transitions) {
        const roles = model.rbac.transitions.filter((rule) => rule.entity === workflow.entity && rule.edges.some((edge) => edge.from === move.from && edge.to === move.to)).flatMap((rule) => rule.roles);
        lines.push(`- ${title2(move.from)} → ${title2(move.to)}${move.trigger ? ` (${title2(move.trigger)})` : ""}${roles.length ? ` — only ${[...new Set(roles)].map(title2).join(", ")}` : ""}`);
      }
      lines.push("");
    }
  }
  const roles = access.roles.filter((role) => !role.isAdmin);
  if (roles.length > 0) {
    lines.push("## Roles", "");
    for (const role of roles) {
      const count = access.entityCounts[role.name];
      lines.push(`- **${role.name}**${count !== undefined ? ` — reads ${count} of ${model.entities.length} record types` : ""}`);
    }
    lines.push("- **Administrator** — reads and changes everything the lifecycles allow", "", "A refusal means the person's role does not allow it. Say which role does, from this list, and suggest their administrator.", "");
  }
  if (model.reports.length > 0) {
    lines.push("## Reports the business asked for", "");
    lines.push("Search for these by their title with `search_reports`. The reporting platform also holds a register, breakdowns and trends derived for every record type.", "");
    for (const report of model.reports) {
      const help = prose(report.help, 300);
      lines.push(`- **${prose(report.title, 120)}**${report.entity ? ` (${title2(report.entity)})` : ""}${help ? ` — ${help}` : ""}`);
    }
    lines.push("");
  }
  return `${lines.join(`
`).replace(/\n{3,}/g, `

`).trimEnd()}
`;
}

// packages/generator/src/pipeline/chat-bundle.ts
var MARKER2 = join("gateway", "server.ts");
function skipped(name) {
  if (name === ".dockerignore")
    return false;
  return name === "node_modules" || name.startsWith(".");
}
function locateChatSource() {
  const configured = "/chat-deepseek";
  if (configured)
    return existsSync(join(configured, MARKER2)) ? resolve(configured) : null;
  let directory = dirname(fileURLToPath(import.meta.url));
  for (;; ) {
    const candidate = join(directory, "chat-deepseek");
    if (existsSync(join(candidate, MARKER2)))
      return candidate;
    const parent = dirname(directory);
    if (parent === directory)
      return null;
    directory = parent;
  }
}
async function copyTree2(from, to, written, prefix = "") {
  await mkdir2(to, { recursive: true });
  for (const entry of (await readdir2(from, { withFileTypes: true })).sort((a, b) => a.name.localeCompare(b.name))) {
    if (skipped(entry.name))
      continue;
    const source = join(from, entry.name);
    const target = join(to, entry.name);
    const relative = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isDirectory()) {
      await copyTree2(source, target, written, relative);
    } else if (entry.isFile()) {
      await copyFile2(source, target);
      written.push(relative);
    }
  }
}
function renderChatEnvExample(options) {
  return `# The chat for ${options.projectName}. Copy to .env, or let \`docker compose\`
# pass these through. Variables marked "generated" are created once by the
# project's setup and must then never change: rotating CHAT_AUTH_SECRET ends
# every chat session, and replacing SSO_SIGNING_KEY without SSO_PUBLIC_KEY
# makes every reporting sign-in fail.

# Where the browser reaches the chat, and the path it is mounted on.
CHAT_PUBLIC_ORIGIN=http://localhost
CHAT_BASE_PATH=/chat
CHAT_HOST=0.0.0.0
CHAT_PORT=3100
CHAT_INTERNAL_PORT=3101
# Set only when a reverse proxy you control sits in front and sets X-Forwarded-For.
CHAT_TRUST_PROXY=1

# The chat's own database. NEVER the application's: the reporting platform
# reads every schema of the database it reports on, so chat sessions stored
# there would become reportable rows.
CHAT_DATABASE_URL=postgres://postgres:postgres@localhost:5432/${options.projectName.replace(/[^a-z0-9]+/gi, "_").toLowerCase()}_chat
CHAT_DATABASE_SCHEMA=chat
# generated: openssl rand -hex 32
CHAT_AUTH_SECRET=

# The application this chat belongs to, as the gateway reaches it, and where
# the browser reaches it.
CHAT_APP_API_URL=http://localhost:${options.port}/api
CHAT_APP_PUBLIC_PATH=/app

# The reporting platform. Leave CHAT_REPORT_API_URL empty to run without it.
CHAT_REPORT_API_URL=http://localhost:5150/api
CHAT_REPORT_PUBLIC_PATH=/report
# generated: an Ed25519 key pair. The private half stays here; the public half
# is the reporting platform's SSO_PUBLIC_KEY.
SSO_SIGNING_KEY=

# DeepSeek. The key is required; nothing else in the application uses it.
DEEPSEEK_API_KEY=
DEEPSEEK_BASE_URL=https://api.deepseek.com/anthropic
# deepseek-flash (the default) or deepseek-v4-pro, from the DeepSeek catalogue Harness ships.
CHAT_DEEPSEEK_MODEL=deepseek-flash

# One Harness host per signed-in person. See README.md for what this costs.
# Empty means the default: node on PATH (Harness needs Node 22.19 or later),
# the installed Harness, and this directory's skills and AGENTS.md.
CHAT_NODE_BIN=
CHAT_DSH_BIN=
CHAT_SKILLS_DIR=
CHAT_AGENTS_FILE=
CHAT_HOST_START_TIMEOUT_MS=60000
CHAT_HOST_PORTS=41000-41999
CHAT_HOST_IDLE_MINUTES=30
CHAT_HOST_HEAP_MB=256
# 0 derives the ceiling from the machine's memory.
CHAT_MAX_HOSTS=0
CHAT_VIEW_TTL_SECONDS=600
CHAT_DATA_DIR=./.data
`;
}
async function writeChatBundle(outputDir, model, options) {
  if (options.skipFrontend)
    return [];
  const source = locateChatSource();
  if (!source) {
    throw new Error("The chat (chat-deepseek/) was not found beside the generator. Set APPWITHAI_CHAT_DIR to its directory.");
  }
  const target = join(outputDir, "chat");
  const written = [];
  if (existsSync(target)) {
    for (const entry of await readdir2(target)) {
      if (entry === ".data" || entry === ".env" || entry === "node_modules")
        continue;
      await rm2(join(target, entry), { recursive: true, force: true });
    }
  }
  await copyTree2(source, target, written);
  const skill = domainSkillName(options.projectName);
  const skillDirectory = join(target, "skills", skill);
  await mkdir2(skillDirectory, { recursive: true });
  await writeFile2(join(skillDirectory, "SKILL.md"), renderDomainSkill(model, { projectName: options.projectName }));
  written.push(`skills/${skill}/SKILL.md`);
  await writeFile2(join(target, ".env.example"), renderChatEnvExample(options));
  written.push(".env.example");
  return written;
}

// packages/generator/src/pipeline/settings.ts
var GENERATION_DEFAULTS = {
  projectVersion: "1.0.0",
  projectDescription: "Generated application",
  stackOption: "tanstack-astryx-loco",
  database: "postgres",
  port: 3000,
  enableDarkMode: false,
  astryxTheme: "neutral",
  recordsPerEntity: 1000,
  skipCliScaffold: false
};

// packages/generator/src/pipeline/generate-application.ts
var warnOnConsole = (message) => console.warn(`  ⚠️  ${message}`);
function buildGeneratorOptions(model, settings) {
  const port = settings.port ?? GENERATION_DEFAULTS.port;
  return {
    stackOption: settings.stackOption ?? GENERATION_DEFAULTS.stackOption,
    projectName: settings.projectName,
    projectVersion: settings.projectVersion ?? GENERATION_DEFAULTS.projectVersion,
    projectDescription: settings.projectDescription ?? GENERATION_DEFAULTS.projectDescription,
    database: settings.database ?? GENERATION_DEFAULTS.database,
    astryxTheme: settings.astryxTheme ?? GENERATION_DEFAULTS.astryxTheme,
    outputDir: settings.outputDir,
    port,
    frontendPort: settings.frontendPort ?? port + 1,
    tanstackStartNestjs: {
      frontend: {
        apiBaseUrl: settings.apiBaseUrl ?? `http://localhost:${port}`,
        enableDarkMode: settings.enableDarkMode ?? GENERATION_DEFAULTS.enableDarkMode
      }
    },
    skipFrontend: !!settings.skipFrontend,
    skipBackend: !!settings.skipBackend,
    skipTests: !!settings.skipTests,
    skipCliScaffold: settings.skipCliScaffold ?? GENERATION_DEFAULTS.skipCliScaffold,
    recordsPerEntity: settings.recordsPerEntity ?? GENERATION_DEFAULTS.recordsPerEntity,
    categories: model.categories,
    modelEnums: model.enums,
    compiledRbac: model.rbac,
    compiledRules: model.rules,
    compiledReports: model.reports,
    compiledWorkflows: model.workflows,
    compiledHooks: model.hooks,
    sagas: model.sagas
  };
}
async function writeManifest(outputDir, model, settings, extras = {}) {
  const port = settings.port ?? GENERATION_DEFAULTS.port;
  try {
    await writeFile2(join(outputDir, ".appwithai.json"), JSON.stringify({
      name: settings.projectName,
      version: settings.projectVersion ?? GENERATION_DEFAULTS.projectVersion,
      description: settings.projectDescription ?? GENERATION_DEFAULTS.projectDescription,
      stack: settings.stackOption ?? GENERATION_DEFAULTS.stackOption,
      database: settings.database ?? GENERATION_DEFAULTS.database,
      input: extras.input,
      backendPort: port,
      frontendPort: settings.frontendPort ?? port + 1,
      apiUrl: settings.apiBaseUrl ?? `http://localhost:${port}`,
      entities: model.entities.map((entity) => entity.name),
      categories: model.categories.map((category) => category.name),
      enums: model.enums.map((modelEnum) => `${modelEnum.name} (${modelEnum.values.length})`),
      sagas: model.sagas.map((saga) => `${saga.name} on ${saga.entity} (${saga.steps.length} steps, ${saga.trigger})`),
      lastWriteWins: model.entities.filter((entity) => entity.concurrency === "last-write-wins").map((entity) => entity.name),
      finalStates: model.workflows.filter((workflow) => workflow.terminal.length > 0).map((workflow) => `${workflow.entity}: ${workflow.terminal.join(", ")}`),
      packageManager: extras.packageManager,
      generatedAt: new Date().toISOString()
    }, null, 2));
  } catch {}
}
async function writeManual(outputDir, model, options) {
  if (options.skipFrontend)
    return;
  try {
    const directory = join(outputDir, "frontend", "public");
    await mkdir2(directory, { recursive: true });
    await writeFile2(join(directory, "manual.html"), renderManual(model, {
      name: options.projectName,
      version: options.projectVersion ?? GENERATION_DEFAULTS.projectVersion,
      description: options.projectDescription ?? GENERATION_DEFAULTS.projectDescription,
      stack: "loco"
    }), "utf-8");
    console.log("  ✓ Wrote frontend/public/manual.html");
  } catch {}
}
async function writeModelFile(outputDir, modelText, cedm) {
  try {
    await mkdir2(join(outputDir, "model"), { recursive: true });
    if (cedm) {
      await writeFile2(join(outputDir, "model", "model.cedm.yaml"), cedm.text, "utf-8");
      await writeFile2(join(outputDir, "model", "model.eml.yaml"), `# Compiled from model.cedm.yaml, which is the source of this application.
` + `# Regenerate rather than edit: a change here is lost on the next run.
` + serializeModelDocument(cedm.document), "utf-8");
      return;
    }
    await writeFile2(join(outputDir, "model", "model.eml.yaml"), modelText, "utf-8");
  } catch {}
}
async function generateApplication(options) {
  const model = options.model ?? compileModelDocument(options.document, { warn: warnOnConsole });
  const log = options.logger ?? getLogger("pipeline");
  const project = options.projectName;
  const started = Date.now();
  log.event("pipeline.generation.started", {
    project,
    stack: options.stackOption ?? GENERATION_DEFAULTS.stackOption,
    entities: model.entities.length
  });
  try {
    await mkdir2(options.outputDir, { recursive: true });
    const generator = new FullStackGenerator(buildGeneratorOptions(model, options));
    await generator.generate(model.entities, model.relationships);
    await writeModelFile(options.outputDir, options.modelText, options.cedm ? { text: options.cedm.text, document: options.document } : undefined);
    await writeCedmBundle(options.outputDir, options.cedm);
    const port = options.port ?? GENERATION_DEFAULTS.port;
    await writeChatBundle(options.outputDir, model, {
      projectName: options.projectName,
      port,
      frontendPort: options.frontendPort ?? port + 1,
      skipFrontend: options.skipFrontend
    });
    await writeManual(options.outputDir, model, options);
    if (options.writeManifestFile !== false) {
      await writeManifest(options.outputDir, model, options, options.manifest ?? {});
    }
  } catch (error) {
    log.event("pipeline.generation.failed", {
      project,
      reason: error instanceof Error ? error.message : String(error)
    });
    throw error;
  }
  log.event("pipeline.generation.completed", {
    project,
    files: model.entities.length,
    durationMs: Date.now() - started
  });
  return model;
}

// packages/generator/src/pipeline/logger-port.ts
var NO_LOG = {
  event() {}
};

// language/browser/loco-generator.entry.ts
init_fs();
var LOCO_DEFAULTS = {
  version: "1.0.0",
  theme: "neutral",
  database: "postgres",
  port: 3000,
  frontendPort: 3001,
  recordsPerEntity: 1000
};
var OUTPUT = "/out";
function decode(asset) {
  if (typeof asset === "string")
    return asset;
  const binary = atob(asset.base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0;i < binary.length; i++)
    bytes[i] = binary.charCodeAt(i);
  return bytes;
}
var mounted;
async function generateLocoApplication(options) {
  if (!options.document.entities?.length) {
    throw new Error("This model declares no entities. A model declares its entities under `entities:`.");
  }
  if (mounted !== options.assets) {
    mount(Object.fromEntries(Object.entries(options.assets).map(([path, asset]) => [path, decode(asset)])));
    mounted = options.assets;
  }
  unmount(OUTPUT);
  const outputDir = `${OUTPUT}/${options.name}`;
  await generateApplication({
    document: options.document,
    modelText: options.modelText,
    projectName: options.name,
    projectVersion: options.version ?? LOCO_DEFAULTS.version,
    projectDescription: options.description ?? options.document.description,
    outputDir,
    stackOption: "tanstack-astryx-loco",
    astryxTheme: options.theme ?? LOCO_DEFAULTS.theme,
    database: options.database ?? LOCO_DEFAULTS.database,
    port: LOCO_DEFAULTS.port,
    frontendPort: LOCO_DEFAULTS.frontendPort,
    apiBaseUrl: `http://localhost:${LOCO_DEFAULTS.port}`,
    enableDarkMode: false,
    skipCliScaffold: true,
    recordsPerEntity: LOCO_DEFAULTS.recordsPerEntity,
    manifest: { input: "model.eml.yaml", packageManager: "bun" },
    logger: NO_LOG
  });
  const application = { files: snapshot(outputDir), executables: executables(outputDir) };
  unmount(OUTPUT);
  return application;
}
export {
  LOCO_DEFAULTS,
  generateLocoApplication
};
