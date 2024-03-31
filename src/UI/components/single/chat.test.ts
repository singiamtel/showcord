import { test, expect, suite } from 'vitest';
import { render } from '@testing-library/react';
import { FormatMsgDisplay } from '@/UI/chatFormatting/MessageParser';

suite('inlineCode', () => {
    test('should render code', () => {
        const JSX = FormatMsgDisplay({ msg: '`test`' });
        const { container } = render(JSX);
        expect(container.querySelector('code')?.textContent).toEqual('test');
    });

    test('should render many different code elements', () => {
        const message = 'This can be ```used``` to see if the ```bug``` if ```still``` present or it is ```solved```';
        const expected = ['used', 'bug', 'still', 'solved'];
        const JSX = FormatMsgDisplay({ msg: message });
        const { container } = render(JSX);
        const codeElements = container.querySelectorAll('code');
        expect(codeElements.length).toEqual(expected.length);
        codeElements.forEach((el, i) => {
            expect(el.textContent).toEqual(expected[i]);
        });
    });

    test('should work with multiple backticks', () => {
        const message = '`one` ``two`` ```three``` ````four````';
        const expected = ['one', 'two', 'three', 'four'];
        const JSX = FormatMsgDisplay({ msg: message });
        const { container } = render(JSX);
        const codeElements = container.querySelectorAll('code');
        expect(codeElements.length).toEqual(expected.length);
        codeElements.forEach((el, i) => {
            expect(el.textContent).toEqual(expected[i]);
        });
    });
});

