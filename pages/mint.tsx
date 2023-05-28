import styles from "../styles/Home.module.css";
import { ChangeEvent } from "react";
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  Textarea,
} from "@chakra-ui/react";
import {
  ThirdwebNftMedia,
  useAddress,
  useContract,
  useNFTs,
  Web3Button,
} from "@thirdweb-dev/react";

import type { NextPage } from "next";
import { useState } from "react";
import { NFT_COLLECTION_ADDRESS } from "../const/addresses";

const Mint: NextPage = () => {
  const address = useAddress();

  // Fetch the NFT collection from thirdweb via it's contract address.
  const { contract: nftCollection } = useContract(
    NFT_COLLECTION_ADDRESS,
    "nft-collection"
  );

  // Load all the minted NFTs in the collection
  const { data: nfts, isLoading: loadingNfts } = useNFTs(nftCollection);

  // Here we store the user inputs for their NFT.
  const [nftName, setNftName] = useState<string>("");
  const [nftImage, setNftImage] = useState<File | null>(null);
  const [nftDescription, setNftDescription] = useState<string>("");
  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files && e.target.files[0];
    setNftImage(file || null);
  };

  // This function calls a Next JS API route that mints an NFT with signature-based minting.
  // We send in the address of the current user, and the text they entered as part of the request.
  const mintWithSignature = async () => {
    try {
      // Make a request to /api/server
      const data = new FormData();
      data.append("file", nftImage as File);
      data.append("upload_preset", "nft-uploads");
      data.append("name", "drec1cilb");
      console.log(data);
      const res = await fetch(
        "https://api.cloudinary.com/v1_1/drec1cilb/image/upload",
        {
          method: "POST",
          body: data,
        }
      )
        .then((r) => r.json())
        .catch((err) => console.log(err));

      const signedPayloadReq = await fetch(`/api/generate`, {
        method: "POST",
        body: JSON.stringify({
          authorAddress: address, // Address of the current user
          nftName: nftName || "",
          nftImage: res.secure_url || "",
          nftDescription: nftDescription || "",
        }),
      });

      // Grab the JSON from the response
      const json = await signedPayloadReq.json();

      if (!signedPayloadReq.ok) {
        alert(json.error);
      }

      // If the request succeeded, we'll get the signed payload from the response.
      // The API should come back with a JSON object containing a field called signedPayload.
      // This line of code will parse the response and store it in a variable called signedPayload.
      const signedPayload = json.signedPayload;

      // Now we can call signature.mint and pass in the signed payload that we received from the server.
      // This means we provided a signature for the user to mint an NFT with.
      const nft = await nftCollection?.signature.mint(signedPayload);

      alert("Minted succesfully!");
      setNftName("");
      setNftDescription("");
      setNftImage(null);
      return nft;
    } catch (e) {
      console.error("An error occurred trying to mint the NFT:", e);
    }
  };

  return (
    <div className={styles.container}>
      <Box maxW="md" mx="auto">
        <div className={styles.collectionContainer}>
          <h2 className={styles.ourCollection}>Mint your own NFT:</h2>
          <FormControl>
            <FormLabel>Name:</FormLabel>
            <Input
              type="text"
              value={nftName}
              onChange={(e) => setNftName(e.target.value)}
            />
          </FormControl>
          <FormControl mt={4}>
            <FormLabel>Description:</FormLabel>
            <Textarea
              value={nftDescription}
              onChange={(e) => setNftDescription(e.target.value)}
            />
          </FormControl>
          <FormControl>
            <FormLabel>Image:</FormLabel>
            <Input
              style={{ paddingTop: 4 }}
              type="file"
              id="image-input"
              accept="image/*"
              onChange={handleImageChange}
            />
          </FormControl>
        </div>
      </Box>
      <div style={{ marginTop: 24 }}>
        <Web3Button
          contractAddress={NFT_COLLECTION_ADDRESS!}
          action={() => mintWithSignature()}
        >
          Mint NFT
        </Web3Button>
      </div>
      <hr className={styles.smallDivider} />

      <div className={styles.collectionContainer}>
        <h2 className={styles.ourCollection}>Recent Mints:</h2>

        {loadingNfts ? (
          <p>Loading...</p>
        ) : (
          <div className={styles.nftGrid}>
            {nfts?.map((nft) => (
              <div className={styles.nftItem} key={nft.metadata.id.toString()}>
                <div style={{ textAlign: "center" }}>
                  <p>Name</p>
                  <p>
                    <b>{nft.metadata.name}</b>
                  </p>
                </div>

                <div style={{ textAlign: "center" }}>
                  <p>Owned by</p>
                  <p>
                    <b>
                      {nft.owner
                        .slice(0, 6)
                        .concat("...")
                        .concat(nft.owner.slice(-4))}
                    </b>
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Mint;
