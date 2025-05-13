import {
  type Action,
  type HandlerCallback,
  type IAgentRuntime,
  type Memory,
  ModelType,
  type State,
  logger,
} from "@elizaos/core";
import type { McpService } from "../service";
import { toolSelectionTemplate } from "../templates/toolSelectionTemplate";
import { MCP_SERVICE_NAME } from "../types";
import { handleMcpError } from "../utils/error";
import { withModelRetry } from "../utils/mcp";
import { handleToolResponse, processToolResult } from "../utils/processing";
import { createToolSelectionFeedbackPrompt, validateToolSelection } from "../utils/validation";
import type { ToolSelection } from "../utils/validation";

function createToolSelectionPrompt(
  state: State,
  mcpProvider: { values: { mcp: unknown }; data: { mcp: unknown }; text: string }
): string {
  return composePromptFromState({
    state: {
      ...state,
      values: {
        ...state.values,
        mcpProvider,
      },
    },
    template: toolSelectionTemplate,
  });
}

import { composePromptFromState } from "@elizaos/core";

export const callToolAction: Action = {
  name: "CALL_TOOL",
  similes: [
    "CALL_MCP_TOOL",
    "USE_TOOL",
    "USE_MCP_TOOL",
    "EXECUTE_TOOL",
    "EXECUTE_MCP_TOOL",
    "RUN_TOOL",
    "RUN_MCP_TOOL",
    "INVOKE_TOOL",
    "INVOKE_MCP_TOOL",
  ],
  description: "Calls a tool from an MCP server to perform a specific task",

  validate: async (runtime: IAgentRuntime, _message: Memory, _state?: State): Promise<boolean> => {
    const mcpService = runtime.getService<McpService>(MCP_SERVICE_NAME);
    if (!mcpService) return false;

    const servers = mcpService.getServers();
    return (
      servers.length > 0 &&
      servers.some(
        (server) => server.status === "connected" && server.tools && server.tools.length > 0
      )
    );
  },

  handler: async (
    runtime: IAgentRuntime,
    message: Memory,
    _state?: State,
    _options?: { [key: string]: unknown },
    callback?: HandlerCallback
  ): Promise<boolean> => {
    const composedState = await runtime.composeState(message, ["RECENT_MESSAGES", "MCP"]);

    const mcpService = runtime.getService<McpService>(MCP_SERVICE_NAME);
    if (!mcpService) {
      throw new Error("MCP service not available");
    }

    const mcpProvider = mcpService.getProviderData();

    try {
      const toolSelectionPrompt = createToolSelectionPrompt(composedState, mcpProvider);

      logger.info(`Tool selection prompt: ${toolSelectionPrompt}`);

      const toolSelection = await runtime.useModel(ModelType.TEXT_SMALL, {
        prompt: toolSelectionPrompt,
      });

      const parsedSelection = await withModelRetry<ToolSelection>(
        toolSelection,
        runtime,
        (data) => validateToolSelection(data, composedState),
        message,
        composedState,
        (originalResponse, errorMessage, state, userMessage) =>
          createToolSelectionFeedbackPrompt(originalResponse, errorMessage, state, userMessage),
        callback,
        "I'm having trouble figuring out the best way to help with your request. Could you provide more details about what you're looking for?"
      );

      if (!parsedSelection || parsedSelection.noToolAvailable) {
        if (callback && parsedSelection?.noToolAvailable) {
          await callback({
            text: "I don't have a specific tool that can help with that request. Let me try to assist you directly instead.",
            thought:
              "No appropriate MCP tool available for this request. Falling back to direct assistance.",
            actions: ["REPLY"],
          });
        }
        return true;
      }

      const { serverName, toolName, arguments: toolArguments, reasoning } = parsedSelection;

      logger.debug(`Selected tool "${toolName}" on server "${serverName}" because: ${reasoning}`);

      const result = await mcpService.callTool(serverName, toolName, toolArguments);
      logger.debug(
        `Called tool ${toolName} on server ${serverName} with arguments ${JSON.stringify(toolArguments)}`
      );

      const { toolOutput, hasAttachments, attachments } = processToolResult(
        result,
        serverName,
        toolName,
        runtime,
        message.entityId
      );

      await handleToolResponse(
        runtime,
        message,
        serverName,
        toolName,
        toolArguments,
        toolOutput,
        hasAttachments,
        attachments,
        composedState,
        mcpProvider,
        callback
      );

      return true;
    } catch (error) {
      return handleMcpError(composedState, mcpProvider, error, runtime, message, "tool", callback);
    }
  },

  examples: [
    [
      {
        name: "{{user}}",
        content: {
          text: "Can you get me the current account info?",
        },
      },
      {
        name: "{{assistant}}",
        content: {
          text: "One sec, fool! Let me access the right tool...",
          actions: ["CALL_MCP_TOOL"],
        },
      },
      {
        name: "{{assistant}}",
        content: {
          text: "I found your account info:\n\nYour current account information is as follows:\n- Wallet Address: 0xCD9C472890bDF80Ca8fF231D0DcC156f5136517B\n- Total Account Value: 0\n- Total Collateral: 0\n- Total Initial Margin: 0\n- Total Maintenance Margin: 0\n- Free Collateral: 0\n- Margin Fraction: 0\n- Positions: None\n- Last Updated: Recently\n\nIf you need more details or specific information, please let me know.",
          actions: ["CALL_MCP_TOOL"],
        },
      },
    ],
    [
      {
        name: "{{user}}",
        content: {
          text: "Can you list all the mids??",
        },
      },
      {
        name: "{{assistant}}",
        content: {
          text: "One sec, fool! Let me access the right tool...",
          actions: ["CALL_MCP_TOOL"],
        },
      },
      {
        name: "{{assistant}}",
        content: {
          text: "Here are some of the current mid prices for various assets:\n- BTC-SPOT: 102.76\n- ETH-PERP: 1839.35\n- SOL-PERP: 146.995\n- USDC2-SPOT: 0.99999\n- AAVE-PERP: 175.11\n- ADA-PERP: 0.687385\n- ALGO-PERP: 0.20165\n- BNB-PERP: 588.745\n- AVAX-PERP: 20.1285\n- MATIC-PERP: 0.37035\n\nIf you need mid prices for specific assets or a complete list, please let me know!",
          actions: ["CALL_MCP_TOOL"],
        },
      },
    ],
    [
      {
        name: "{{user}}",
        content: {
          text: "Can I get the ai16z perp?",
        },
      },
      {
        name: "{{assistant}}",
        content: {
          text: "One sec, fool! Let me access the right tool...",
          actions: ["CALL_MCP_TOOL"],
        },
      },
      {
        name: "{{assistant}}",
        content: {
          text: "The current price for AI16Z-PERP is approximately 0.26725. If you need more information or further assistance, please let me know!",
          actions: ["CALL_MCP_TOOL"],
        },
      },
    ]
  ],
};
