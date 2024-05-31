import wallet from "../wba-wallet.json"
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults"
import { createGenericFile, createSignerFromKeypair, signerIdentity } from "@metaplex-foundation/umi"
import { irysUploader } from "@metaplex-foundation/umi-uploader-irys"
import { readFile } from "fs/promises"

// Create a devnet connection
const umi = createUmi('https://api.devnet.solana.com');

let keypair = umi.eddsa.createKeypairFromSecretKey(new Uint8Array(wallet));
const signer = createSignerFromKeypair(umi, keypair);

umi.use(irysUploader());
umi.use(signerIdentity(signer));

(async () => {
    try {
        const filename = "./cluster1/nft_image.png";
        //1. Load image
        const image = await readFile(filename);

        //2. Convert image to generic file.
        const genericFile = await createGenericFile(image,filename);
        
        //3. Upload image
        const uri = await umi.uploader.upload([genericFile]);

        console.log("Your image URI: ", uri);

        // Result:
        // Your image URI:  [ 'https://arweave.net/DlBQeYnzUA6K5mAzfNS-KzEhju4T1F-ebpLoo-Qao0g' ]
    }
    catch(error) {
        console.log("Oops.. Something went wrong", error);
    }
})();
