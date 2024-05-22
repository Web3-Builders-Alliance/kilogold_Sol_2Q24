import wallet from "../wba-wallet.json"
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults"
import { 
    createMetadataAccountV3, 
    CreateMetadataAccountV3InstructionAccounts, 
    CreateMetadataAccountV3InstructionArgs,
    DataV2Args,
} from "@metaplex-foundation/mpl-token-metadata";
import { createSignerFromKeypair, signerIdentity, publicKey } from "@metaplex-foundation/umi";
import bs58 from 'bs58'

// Define our Mint address
const mint = publicKey("4FHnUReHAwQ29wpjRxJCphWYyjKMsgiAzU94M1f1tCVx")

// Create a UMI connection
const umi = createUmi('https://api.devnet.solana.com');
const keypair = umi.eddsa.createKeypairFromSecretKey(new Uint8Array(wallet));
const signer = createSignerFromKeypair(umi, keypair);
umi.use(signerIdentity(createSignerFromKeypair(umi, keypair)));

(async () => {
    try {
        // Start here
        let accounts: CreateMetadataAccountV3InstructionAccounts = {
            mint: mint,
            mintAuthority: signer,
        };

        let data: DataV2Args = {
            name: "TokeN",
            symbol: "TKN",
            uri: "https://www.example.com",
            sellerFeeBasisPoints: 0,
            creators: null,
            collection: null,
            uses: null,
        }

        let args: CreateMetadataAccountV3InstructionArgs = {
            data: data,
            isMutable: true,
            collectionDetails: null,
        }

        let tx = createMetadataAccountV3(
            umi,
            {
                ...accounts,
                ...args
            }
        )

        let result = await tx.sendAndConfirm(umi).then(r => r.signature);
        console.log(result);
        console.log(bs58.encode(Buffer.from(result)));

        // Result:
        // https://explorer.solana.com/tx/5yiFALg7vmYi64BJd1FU6FthuqCHZBSkUZYovkiUrrJHujdcHWeZQEk7MEH42XATMaGighZNUuHivuWwiHmfB2Ja?cluster=devnet
        
    } catch(e) {
        console.error(`Oops, something went wrong: ${e}`)
    }
})();