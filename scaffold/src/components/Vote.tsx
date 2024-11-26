// TODO: SignMessage
import { verify } from '@noble/ed25519';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import bs58 from 'bs58';
import { FC, useCallback, useState } from 'react';
import { notify } from "../utils/notifications";
import {Program, AnchorProvider, web3, utils, BN, setProvider} from "@coral-xyz/anchor";
import idl from "./voting.json";
import {Voting} from "./voting";
import { PublicKey } from '@solana/web3.js';
import { connect } from 'http2';

const idl_string = JSON.stringify(idl);
const idl_object = JSON.parse(idl_string);
const programID= new PublicKey(idl.address);



export const Vote: FC = () => {
    const Wallet = useWallet();
    const {connection} = useConnection();
    const [candidates, setCandidates] = useState([])
    
        
    const [candidateName, setCandidateName] = useState('');
    const [candidateImage, setCandidateImage] = useState('');
    const [candidateDescription, setCandidateDescription] = useState('');
    const getProvider= () =>{
        const provider = new AnchorProvider(connection,Wallet,AnchorProvider.defaultOptions());
        setProvider(provider)
        return provider
    }

    const addCandidate = async() =>{
        try{
            const anchProvider = getProvider()
            const program = new Program<Voting>(idl_object,anchProvider)
            if (!candidateName || !candidateImage || !candidateDescription) {
                console.error("Please fill in all fields.");
                return;
              }

            await program.methods.elect(candidateName,candidateImage,candidateDescription).accounts({
                signer: anchProvider.publicKey,
            }).rpc()
            setCandidateName('');
            setCandidateImage('');
            setCandidateDescription('');

            console.log("New Candidate has been added to the elections.")
        } catch (error){
            console.error("Error while adding new candidate: "+ error)
        }
    
    }

    const getCandidates = async() =>{
        try{
            const anchProvider = getProvider()
            const program = new Program<Voting>(idl_object,anchProvider)
            const candidates = await program.account.elect.all();

            console.log(candidates);
        
            // Map the candidates to extract the account data and public key
            setCandidates(
              candidates.map((candidate) => ({
                ...candidate.account,
                pubkey: candidate.publicKey,
              }))
            );


        } catch (error){
            console.error("Error while getting candidates: "+ error)
        }
    
    }

    const vote = async(publicKey) =>{
        try{
            const anchProvider = getProvider()
            const program = new Program<Voting>(idl_object,anchProvider)

            await program.methods.castVote().accounts({
                elect:publicKey,
                signer:anchProvider.publicKey,
            }).rpc()

            console.log("Vote successful!")
        } catch (error){
            console.error("Error while casting vote: "+ error)
        }
    
    }
    return (
        <div>
          <div className="flex flex-col items-center">
            <input
              type="text"
              placeholder="Candidate Name"
              value={candidateName}
              onChange={(e) => setCandidateName(e.target.value)}
              className="input input-bordered w-full max-w-xs m-2"
            />
            <input
              type="text"
              placeholder="Image URL"
              value={candidateImage}
              onChange={(e) => setCandidateImage(e.target.value)}
              className="input input-bordered w-full max-w-xs m-2"
            />
            <textarea
              placeholder="Description"
              value={candidateDescription}
              onChange={(e) => setCandidateDescription(e.target.value)}
              className="textarea textarea-bordered w-full max-w-xs m-2"
            ></textarea>
            <button
              className="group w-60 m-2 btn animate-pulse bg-gradient-to-br from-silver-500 to-gray-500 
                hover:from-gray hover:to-silver-300 text-silver"
              onClick={addCandidate}
            >
              <div className="hidden group-disabled:block">Wallet not connected</div>
              <span className="block group-disabled:hidden">Add Candidate</span>
            </button>
          </div>
      
          <div className="flex flex-row justify-center">
            <button
              className="group w-60 m-2 btn animate-pulse bg-gradient-to-br from-silver-500 to-gray-500 
                hover:from-gray hover:to-silver-300 text-silver"
              onClick={getCandidates}
            >
              <div className="hidden group-disabled:block">Wallet not connected</div>
              <span className="block group-disabled:hidden">Fetch Candidates</span>
            </button>
          </div>
      
          {candidates.map((candidate) => {
            return (
                <div
                className="flex flex-col items-center shadow-lg rounded-lg p-4 w-60"
                key={candidate.pubkey.toString()}
                >
                <h2 className="text-xl font-bold mb-2">{candidate.name.toString()}</h2>
                <img
                    src={candidate.image}
                    alt={candidate.name}
                    className="w-32 h-32 object-cover mb-2 rounded-full"
                />
                <p className="text-center mb-2">{candidate.description.toString()}</p>
                <p className="mb-2">Votes: {candidate.votes.toString()}</p>
                <button
                    className="w-full py-2 px-4 bg-gray-500 text-white rounded hover:bg-silver-600"
                    onClick={() => vote(candidate.pubkey)}
                >
                    Vote
                </button>
                </div>
            );
            })}

        </div>
      );
    }