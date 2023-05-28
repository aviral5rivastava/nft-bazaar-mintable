import { ThirdwebSDK } from "@thirdweb-dev/sdk";
import type { NextApiRequest, NextApiResponse } from "next";

import {
  NFT_COLLECTION_ADDRESS,
  WALLET_PRIVATE_KEY,
} from "../../const/addresses";

export default async function server(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const { authorAddress, nftName, nftImage, nftDescription } = JSON.parse(
      req.body
    );

    if (!WALLET_PRIVATE_KEY) {
      throw new Error("You're missing PRIVATE_KEY in your .env.local file.");
    }

    const sdk = ThirdwebSDK.fromPrivateKey(
      WALLET_PRIVATE_KEY as string,
      "mumbai"
    );

    const nftCollection = await sdk.getContract(
      NFT_COLLECTION_ADDRESS,
      "nft-collection"
    );

    const signedPayload = await nftCollection.signature.generate({
      to: authorAddress,
      metadata: {
        name: nftName as string,
        image: nftImage,
        description: nftDescription,
        properties: {},
      },
      royaltyBps: 1000,
      royaltyRecipient: authorAddress,
    });

    res.status(200).json({
      signedPayload: JSON.parse(JSON.stringify(signedPayload)),
    });
  } catch (e) {
    res.status(500).json({ error: `Server error ${e}` });
  }
}
