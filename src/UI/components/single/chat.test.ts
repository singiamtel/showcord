import { test, expect, suite } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FormatMsgDisplay } from './Chat';

suite('inlineCode', () => {
    test('should render code', () => {
        const JSX = FormatMsgDisplay({ msg: '`test`' });
        const { container } = render(JSX);
        // console.log(container.querySelector('code'));
        expect(container.querySelector('code')?.textContent).toEqual('test');
    });
});

