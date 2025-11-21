import hljs from 'highlight.js';

export function HTMLtoPlain(html: string) {
    const tmp = document.createElement('DIV');
    tmp.innerHTML = html;
    return tmp.innerText || '';
}

const brRegex = /<br\s*\/?>/gi;
const summaryOpenRegex = /<summary\s*>/gi;
const summaryCloseRegex = /<\/summary\s*>/gi;

export default function Code({ message }: any) {
    const msg = message.replace(brRegex, '\n').replace(summaryCloseRegex, '\n')
        .replace(summaryOpenRegex, '');
    const str = HTMLtoPlain(msg);
    const result = hljs.highlightAuto(str);
    const threshold = 5;
    const shouldHighlight = result.relevance >= threshold;

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
                            className="hljs"
                            dangerouslySetInnerHTML={{ __html: result.value }}
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
