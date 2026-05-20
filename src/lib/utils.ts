import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
export class AssertionError extends Error {
    expected?: string;
    actual?: unknown;

    constructor({ message, expected, actual }: {message: string, expected?: string, actual?: unknown}) {
        super(message); // Pass the message to the base Error class constructor
        this.name = 'AssertionError'; // Set the error name to 'AssertionError'
        this.expected = expected; // Set the expected value
        this.actual = actual; // Set the actual value
        Object.setPrototypeOf(this, AssertionError.prototype); // Restore prototype chain
    }

    toString(): string {
        return `${this.name}: ${this.message}` + (this.expected !== undefined && this.actual !== undefined ? `, expected: ${this.expected}, actual: ${this.actual}` : '');
    }
}

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function assert(condition: unknown, message?: string): asserts condition {
    if (!condition) {
        throw new AssertionError({ message: message ?? 'Assert failed', expected: 'true', actual: condition });
    }
}

