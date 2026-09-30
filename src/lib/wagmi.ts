"use client";

import { createConfig, http } from "wagmi";
import { getDefaultConfig } from "connectkit";
import { robinhoodChain } from "./chain";

/**
 * WalletConnect Cloud project ID (free at https://cloud.walletconnect.com).
 * Injected wallets (e.g. MetaMask) still work with a placeholder for local demo.
 */
const walletConnectProjectId =
  process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ??
  "00000000000000000000000000000000";

export const wagmiConfig = createConfig(
  getDefaultConfig({
    chains: [robinhoodChain],
    transports: {
      [robinhoodChain.id]: http("https://rpc.mainnet.chain.robinhood.com"),
    },
    walletConnectProjectId,
    appName: "Cut",
    appDescription: "Film crowdfunding on Robinhood Chain",
    appUrl: "https://cut.local",
  }),
);
