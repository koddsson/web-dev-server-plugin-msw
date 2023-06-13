import { makeDecorator } from '@web/storybook-prebuilt/addons';
import { registerMockRoutes } from './msw.js';

export function withMocks() {
  return makeDecorator({
    name: 'withMocks',
    parameterName: 'mocks',
    wrapper: (getStory, context) => {
      if (context?.parameters?.mocks) {
        registerMockRoutes(context.parameters.mocks);
      }
      return getStory(context);
    },
  });
}
