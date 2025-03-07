import type { Plugin } from "@elizaos/core";
import {
  type Action,
  type Content, type GenerateTextParams, type HandlerCallback, type IAgentRuntime, type Memory, ModelTypes, Service, type State,
  type Provider, type ProviderResult,
  logger
} from "@elizaos/core";
import { z } from "zod";

const configSchema = z.object({
  PLUGIN_NAME: z
    .string()
    .min(1, "Plugin name is not provided")
    .optional()
    .transform((val) => {
      if (!val) {
        console.warn("Warning: Plugin name not provided");
      }
      return val;
    }),
});

/**
 * Example HelloWorld action
 * This demonstrates the simplest possible action structure
 */
const helloWorldAction: Action = {
  name: "HELLO_WORLD",
  similes: ["GREET", "SAY_HELLO"],
  description: "Responds with a simple hello world message",

  validate: async (
    _runtime: IAgentRuntime,
    _message: Memory,
    _state: State
  ): Promise<boolean> => {
    // Always valid
    return true;
  },

  handler: async (
    _runtime: IAgentRuntime,
    message: Memory,
    _state: State,
    _options: any,
    callback: HandlerCallback,
    _responses: Memory[]
  ) => {
    try {
      logger.info("Handling HELLO_WORLD action");
      
      // Simple response content
      const responseContent: Content = {
        text: "hello world!",
        actions: ["HELLO_WORLD"],
        source: message.content.source,
      };

      // Call back with the hello world message
      await callback(responseContent);
      
      return responseContent;
    } catch (error) {
      logger.error("Error in HELLO_WORLD action:", error);
      throw error;
    }
  },

  examples: [
    [
      {
        name: "{{name1}}",
        content: {
          text: "Can you say hello?",
        },
      },
      {
        name: "{{name2}}",
        content: {
          text: "hello world!",
          actions: ["HELLO_WORLD"],
        },
      },
    ]
  ],
};

/**
 * Example Hello World Provider
 * This demonstrates the simplest possible provider implementation
 */
const helloWorldProvider: Provider = {
  name: "HELLO_WORLD_PROVIDER",
  description: "A simple example provider",
  
  get: async (_runtime: IAgentRuntime, _message: Memory, _state: State): Promise<ProviderResult> => {
    return {
      text: "I am a provider",
      values: {},
      data: {}
    };
  }
};

export class StarterService extends Service {
  static serviceType = "starter";
  capabilityDescription =
    "This is a starter service which is attached to the agent through the starter plugin.";
  constructor(protected runtime: IAgentRuntime) {
    super(runtime);
  }

  static async start(runtime: IAgentRuntime) {
    console.log("*** Starting starter service ***");
    const service = new StarterService(runtime);
    return service;
  }

  static async stop(runtime: IAgentRuntime) {
    console.log("*** Stopping starter service ***");
    // get the service from the runtime
    const service = runtime.getService(StarterService.serviceType);
    if (!service) {
      throw new Error("Starter service not found");
    }
    service.stop();
  }

  async stop() {
    console.log("*** Stopping starter service instance ***");
  }
}

export const starterPlugin: Plugin = {
  name: "plugin-starter",
  description: "Plugin starter for elizaOS",
  config: {
    PLUGIN_NAME: process.env.PLUGIN_NAME,
  },
  async init(config: Record<string, string>) {
    console.log("*** Initializing starter plugin ***");
    try {
      const validatedConfig = await configSchema.parseAsync(config);

      // Set all environment variables at once
      for (const [key, value] of Object.entries(validatedConfig)) {
        if (value) process.env[key] = value;
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new Error(
          `Invalid plugin configuration: ${error.errors
            .map((e) => e.message)
            .join(", ")}`
        );
      }
      throw error;
    }
  },
  models: {
    [ModelTypes.TEXT_SMALL]: async (
      _runtime,
      { prompt, stopSequences = [] }: GenerateTextParams
    ) => {
      return "Never gonna give you up, never gonna let you down, never gonna run around and desert you...";
    },
    [ModelTypes.TEXT_LARGE]: async (
      _runtime,
      {
        prompt,
        stopSequences = [],
        maxTokens = 8192,
        temperature = 0.7,
        frequencyPenalty = 0.7,
        presencePenalty = 0.7,
      }: GenerateTextParams
    ) => {
      return "Never gonna make you cry, never gonna say goodbye, never gonna tell a lie and hurt you...";
    },
  },
  tests: [
    {
      name: "plugin_starter_test_suite",
      tests: [
        {
          name: "example_test",
          fn: async (runtime) => {
            console.log("example_test run by ", runtime.character.name);
          },
        },
      ],
    },
  ],
  routes: [
    {
      path: "/helloworld",
      type: "GET",
      handler: async (_req: any, res: any) => {
        // send a response
        res.json({
          message: "Hello World!",
        });
      },
    },
  ],
  events: {
    MESSAGE_RECEIVED: [
      async (params) => {
        console.log("MESSAGE_RECEIVED event received");
        // print the keys
        console.log(Object.keys(params));
      },
    ],
    VOICE_MESSAGE_RECEIVED: [
      async (params) => {
        console.log("VOICE_MESSAGE_RECEIVED event received");
        // print the keys
        console.log(Object.keys(params));
      },
    ],
    SERVER_CONNECTED: [
      async (params) => {
        console.log("SERVER_CONNECTED event received");
        // print the keys
        console.log(Object.keys(params));
      },
    ],
    SERVER_JOINED: [
      async (params) => {
        console.log("SERVER_JOINED event received");
        // print the keys
        console.log(Object.keys(params));
      },
    ],
  },
  services: [StarterService],
  actions: [helloWorldAction],
  providers: [helloWorldProvider],
};
export default starterPlugin;
