/**
 * @format
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import App from '../App';

test('renders the app shell without crashing', async () => {
  let tree: ReactTestRenderer.ReactTestRenderer | undefined;
  await ReactTestRenderer.act(async () => {
    tree = ReactTestRenderer.create(<App />);
  });
  // Wait for persisted state to hydrate.
  await ReactTestRenderer.act(async () => {
    await new Promise<void>(resolve => setTimeout(() => resolve(), 0));
  });
  expect(tree!.root.findAllByProps({ children: 'भगवद गीता' }).length).toBeGreaterThan(0);
  await ReactTestRenderer.act(async () => {
    tree!.unmount();
  });
});
