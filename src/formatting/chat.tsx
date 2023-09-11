import { roboto_mono } from "@/app/usercomponents";
import Linkify from "linkify-react";
import { HTMLAttributes } from "react";
import manageURL from "@/utils/manageURL";

// ``code here`` marks inline code
// ||text|| are spoilers
// **text** is bold
// __text__ is italic
// ~~text~~ is strikethrough
// ^^text^^ is superscript
// \\text\\ is subscript
// [[text]] is a link
// >text is greentext
// /me is an emote

interface ExtendedProps extends HTMLAttributes<HTMLSpanElement> {
  children: string | JSX.Element;
  key?: number;
}

const options = {
  defaultProtocol: "https",
  target: "_blank",
  attributes: {
    onClick: manageURL,
    className: "text-blue-500 underline cursor-pointer",
  },
};


export function inlineCode(
  props: ExtendedProps,
) {
  const key = props.key;
  delete props.key;
  return (
    <code
      className={"text-gray-300 font-mono bg-gray-600 rounded p-0.5 " +
        roboto_mono.className}
      {...props}
      key={key}
    />
  );
}

export function spoiler(
  props: ExtendedProps,
) {
  const key = props.key;
  delete props.key;
  return (
    <Linkify
      as="span"
      className="bg-gray-700 text-gray-700 p-0.5 rounded hover:text-white"
      {...props}
      key={key}
      options={options}
    />
  );
}

export function bold(
  props: ExtendedProps,
) {
  const key = props.key;
  delete props.key;
  return <Linkify as="strong" {...props} key={key} options={options} />;
}

export function italic(
  props: ExtendedProps,
) {
  const key = props.key;
  delete props.key;
  return <Linkify as="em" {...props} key={key} />;
}

export function strikethrough(
  props: ExtendedProps,
) {
  const key = props.key;
  delete props.key;
  return <Linkify as="s" {...props} key={key} />;
}

export function superscript(
  props: ExtendedProps,
) {
  const key = props.key;
  delete props.key;
  return <Linkify as="sup" {...props} key={key} />;
}

export function subscript(
  props: ExtendedProps,
) {
  const key = props.key;
  delete props.key;
  return <Linkify as="sub" {...props} key={key} />;
}

export function link(
  props: ExtendedProps,
) {
  const href = typeof props.children === "string" ? props.children : "";
  const key = props.key;
  delete props.key;
  return (
    <a
      href={href}
      className="text-blue-400 hover:underline"
      {...props}
      key={key}
    />
  );
}

type Optional<T, K extends keyof T> = Pick<Partial<T>, K> & Omit<T, K>;

export function greentext(
  props: Optional<ExtendedProps, "children">,
) {
  const key = props.key;
  const children = props.children;
  delete props.key;
  delete props.children;
  return (
    <Linkify as="span" className="text-green-400" {...props} key={key}>
      &gt;{children}
    </Linkify>
  );
}
