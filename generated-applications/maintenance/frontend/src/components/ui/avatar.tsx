/**
 * Avatar — shadcn surface over Astryx `Avatar`.
 *
 * Radix composes Avatar/AvatarImage/AvatarFallback; Astryx takes `src` and
 * `name` (from which it derives initials) on one component. The sub-components
 * are read for their `src` and fallback text rather than rendered.
 */
import { Children, isValidElement, type ReactElement, type ReactNode } from "react";
import { Avatar as AstryxAvatar } from "@astryxdesign/core/Avatar";

export function AvatarImage(_props: { src?: string; alt?: string; className?: string }) {
  return null;
}

export function AvatarFallback(_props: { children?: ReactNode; className?: string }) {
  return null;
}

export interface AvatarProps {
  children?: ReactNode;
  className?: string;
  src?: string;
  alt?: string;
}

export function Avatar({ children, className, src, alt }: AvatarProps) {
  let imageSrc = src;
  let fallback: string | undefined;

  Children.forEach(children, (child) => {
    if (!isValidElement(child)) return;
    if (child.type === AvatarImage) {
      imageSrc ??= (child.props as { src?: string }).src;
    }
    if (child.type === AvatarFallback) {
      const content = (child as ReactElement<{ children?: ReactNode }>).props.children;
      if (typeof content === "string") fallback = content;
    }
  });

  return <AstryxAvatar src={imageSrc} name={fallback ?? alt} alt={alt} className={className} />;
}

export default Avatar;
