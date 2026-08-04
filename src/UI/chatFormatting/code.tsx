import hljs from 'highlight.js/lib/core';
import bash from 'highlight.js/lib/languages/bash';
import cpp from 'highlight.js/lib/languages/cpp';
import csharp from 'highlight.js/lib/languages/csharp';
import css from 'highlight.js/lib/languages/css';
import diff from 'highlight.js/lib/languages/diff';
import go from 'highlight.js/lib/languages/go';
import java from 'highlight.js/lib/languages/java';
import javascript from 'highlight.js/lib/languages/javascript';
import json from 'highlight.js/lib/languages/json';
import python from 'highlight.js/lib/languages/python';
import sql from 'highlight.js/lib/languages/sql';
import typescript from 'highlight.js/lib/languages/typescript';
import xml from 'highlight.js/lib/languages/xml';
import { useMemo, useRef, useLayoutEffect } from 'react';

hljs.registerLanguage('bash', bash);
hljs.registerLanguage('cpp', cpp);
hljs.registerLanguage('csharp', csharp);
hljs.registerLanguage('css', css);
hljs.registerLanguage('diff', diff);
hljs.registerLanguage('go', go);
hljs.registerLanguage('java', java);
hljs.registerLanguage('javascript', javascript);
hljs.registerLanguage('json', json);
hljs.registerLanguage('python', python);
hljs.registerLanguage('sql', sql);
hljs.registerLanguage('typescript', typescript);
hljs.registerLanguage('xml', xml);

export function HTMLtoPlain(html: string) {
    const tmp = document.createElement('DIV');
    tmp.innerHTML = html;
    return tmp.innerText || '';
}

const brRegex = /<br\s*\/?>/gi;
const summaryOpenRegex = /<summary\s*>/gi;
const summaryCloseRegex = /<\/summary\s*>/gi;

export default function Code({ message }: { message: string }) {
    const msg = message.replace(brRegex, '\n').replace(summaryCloseRegex, '\n')
        .replace(summaryOpenRegex, '');
    const str = HTMLtoPlain(msg);
    const result = useMemo(() => hljs.highlightAuto(str), [str]);
    const threshold = 5;
    const shouldHighlight = result.relevance >= threshold;
    const codeRef = useRef<HTMLElement>(null);

    useLayoutEffect(() => {
        if (shouldHighlight && codeRef.current) {
            codeRef.current.innerHTML = result.value;
        }
    }, [shouldHighlight, result.value]);

    return (
        <div
            className={'ml-10 mr-10 m-2 border border-solid border-gray-601 dark:border-gray-border bg-gray-601 dark:bg-gray-600 rounded p-2 '}
        >
            {shouldHighlight ?
                (
                    <pre
                        className={'whitespace-pre-wrap text-sm '}
                    >
                        <code
                            ref={codeRef}
                            className="hljs"
                        />
                    </pre>
                ) :
                (
                    <pre
                        className={'whitespace-pre-wrap text-sm '}
                    >
                        {str}
                    </pre>
                )}
        </div>
    );
}
