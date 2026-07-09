import * as anchor from "@coral-xyz/anchor";
import { Program, BN } from "@coral-xyz/anchor";
import { Voting } from "../target/types/voting";
import { PublicKey } from "@solana/web3.js";
import { expect } from "chai";

describe("voting", () => {
  anchor.setProvider(anchor.AnchorProvider.env());
  const program = anchor.workspace.Voting as Program<Voting>;

  const pollId = new BN(1);
  const candidateName = "Alice";

  const [pollPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("poll"), pollId.toArrayLike(Buffer, "le", 8)],
    program.programId
  );

  const [candidatePda] = PublicKey.findProgramAddressSync(
    [Buffer.from("candidate"), pollId.toArrayLike(Buffer, "le", 8), Buffer.from(candidateName)],
    program.programId
  );

  it("Initializes a poll", async () => {
    const now = Math.floor(Date.now() / 1000);
    const tx = await program.methods
      .initPoll(pollId, new BN(now - 10), new BN(now + 3600), "Best Framework", "Vote for your favorite")
      .accounts({
        signer: program.provider.publicKey,
        pollAccount: pollPda,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();
    console.log("init_poll tx:", tx);

    const poll = await program.account.pollAccount.fetch(pollPda);
    expect(poll.pollName).to.equal("Best Framework");
  });

  it("Adds a candidate", async () => {
    const tx = await program.methods
      .initializeCandidate(pollId, candidateName)
      .accounts({
        signer: program.provider.publicKey,
        pollAccount: pollPda,
        candidateAccount: candidatePda,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();
    console.log("initialize_candidate tx:", tx);

    const candidate = await program.account.candidateAccount.fetch(candidatePda);
    expect(candidate.candidateVote.toNumber()).to.equal(0);
  });

  it("Votes for a candidate", async () => {
    const tx = await program.methods
      .vote(pollId, candidateName)
      .accounts({
        signer: program.provider.publicKey,
        pollAccount: pollPda,
        candidateAccount: candidatePda,
      })
      .rpc();
    console.log("vote tx:", tx);

    const candidate = await program.account.candidateAccount.fetch(candidatePda);
    expect(candidate.candidateVote.toNumber()).to.equal(1);
  });
});
