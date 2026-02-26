type ConsoleErrorMatcher = RegExp | string;

type ExpectedConsoleError = {
    matcher: ConsoleErrorMatcher;
    hits: number;
};

const expectedConsoleErrors: ExpectedConsoleError[] = [];

function toComparableMessage(args: unknown[]) {
    return args.map((arg) => {
        if (arg instanceof Error) {
            return arg.stack ?? arg.message;
        }

        if (typeof arg === 'string') {
            return arg;
        }

        try {
            return JSON.stringify(arg);
        } catch (_error) {
            return String(arg);
        }
    }).join(' ');
}

function matchesExpectedError(message: string, matcher: ConsoleErrorMatcher) {
    if (typeof matcher === 'string') {
        return message.includes(matcher);
    }

    return matcher.test(message);
}

export function expectConsoleError(matcher: ConsoleErrorMatcher) {
    expectedConsoleErrors.push({ matcher, hits: 0 });
}

export function assertNoUnexpectedConsoleErrors(calls: unknown[][]) {
    const unexpectedErrors: string[] = [];

    for (const callArgs of calls) {
        const message = toComparableMessage(callArgs);
        const expectedError = expectedConsoleErrors.find((entry) =>
            matchesExpectedError(message, entry.matcher)
        );

        if (expectedError) {
            expectedError.hits++;
            continue;
        }

        unexpectedErrors.push(message);
    }

    const unusedMatchers = expectedConsoleErrors.filter((entry) => entry.hits === 0);

    if (unexpectedErrors.length > 0 || unusedMatchers.length > 0) {
        const lines: string[] = [];

        if (unexpectedErrors.length > 0) {
            lines.push('Unexpected console.error calls:');
            lines.push(...unexpectedErrors.map((msg) => `- ${msg}`));
        }

        if (unusedMatchers.length > 0) {
            lines.push('Expected console.error did not happen for matchers:');
            lines.push(
                ...unusedMatchers.map((entry) => `- ${String(entry.matcher)}`),
            );
        }

        throw new Error(lines.join('\n'));
    }
}

export function clearExpectedConsoleErrors() {
    expectedConsoleErrors.length = 0;
}
