import { Plugin } from '@ai16z/eliza';
import { createMemeAction } from './actions/createMeme';

export const memeFatherPlugin: Plugin = {
    name: "memeFather",
    description: "Plugin for managing and tracking community memes",
    actions: [createMemeAction],
    evaluators: [],
    providers: []
};

export default memeFatherPlugin;