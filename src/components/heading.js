import React from "react";
import { FaLink } from 'react-icons/fa';

function slugify(text) {
    return text
      .toString()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^\w\-ãáâàéêíóôúãõç]+/g, '')
      .toLowerCase();
}

function Heading({ level, children, ...props }) {
  const childrenArray = Array.isArray(children) ? children : [children];
  const text = childrenArray
    .map((child) => (typeof child === 'string' ? child : ''))
    .join('');
  const id = slugify(text); // Gera o ID baseado no texto do título
  const Tag = 'h' + level;

  // Classe CSS baseada no nível do heading
  const headingClass = `heading-level-${level}`;

  return (
    <Tag id={id} className={headingClass} {...props}>
      {children}
      <a
        href={`#${id}`}
        aria-label={`Link para o título ${children}`}
        className="heading-link"
      >
        <FaLink />
      </a>
    </Tag>
  );
}

export { Heading };