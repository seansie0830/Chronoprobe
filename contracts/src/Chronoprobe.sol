// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {MerkleProof} from "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import {MessageHashUtils} from "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";

/**
 * @title Chronoprobe
 * @notice Cryptographic time-interval proofing system.
 * Anchors Merkle roots at specific block heights to prove that certified messages existed
 * strictly between [startBlock, endBlock].
 */
contract Chronoprobe {
    using MerkleProof for bytes32[];

    struct Anchor {
        uint256 blockNumber;
        uint256 timestamp;
        address publisher;
    }

    struct AssertionInput {
        address author;
        bytes32 dataHash;
        uint256 startBlock;
        bytes32 startBlockHash;
        bytes signature;
    }

    /// @notice Merkle Root => Anchor metadata
    mapping(bytes32 => Anchor) public anchors;

    /// @notice List of all anchored Merkle roots
    bytes32[] public allRoots;

    event RootCommitted(
        bytes32 indexed root,
        uint256 indexed blockNumber,
        uint256 timestamp,
        address indexed publisher
    );

    error RootAlreadyAnchored(bytes32 root);
    error InvalidMerkleProof();
    error InvalidTimeInterval(uint256 startBlock, uint256 endBlock);
    error InvalidSignature(address recovered, address expected);

    /**
     * @notice Commits a Merkle root to the blockchain, establishing an upper bound (t < endBlock).
     * @param root The root hash of the Merkle tree containing batched message leaves.
     */
    function commitRoot(bytes32 root) external returns (uint256 blockNumber, uint256 timestamp) {
        if (anchors[root].blockNumber != 0) {
            revert RootAlreadyAnchored(root);
        }

        blockNumber = block.number;
        timestamp = block.timestamp;

        anchors[root] = Anchor({
            blockNumber: blockNumber,
            timestamp: timestamp,
            publisher: msg.sender
        });

        allRoots.push(root);

        emit RootCommitted(root, blockNumber, timestamp, msg.sender);
    }

    /**
     * @notice Checks if a Merkle root is anchored on-chain.
     */
    function isAnchored(bytes32 root) external view returns (bool) {
        return anchors[root].blockNumber != 0;
    }

    /**
     * @notice Returns total number of anchored roots.
     */
    function getRootCount() external view returns (uint256) {
        return allRoots.length;
    }

    /**
     * @notice Verifies standard OpenZeppelin Merkle inclusion proof.
     */
    function verifyProof(
        bytes32 root,
        bytes32 leaf,
        bytes32[] calldata proof
    ) public pure returns (bool) {
        return MerkleProof.verify(proof, root, leaf);
    }

    /**
     * @notice Computes leaf hash for an authored assertion.
     */
    function computeLeaf(
        address author,
        bytes32 dataHash,
        uint256 startBlock,
        bytes32 startBlockHash,
        bytes memory signature
    ) public pure returns (bytes32) {
        return keccak256(
            abi.encode(author, dataHash, startBlock, startBlockHash, signature)
        );
    }

    /**
     * @notice Computes the digest expected to be signed by the author.
     */
    function computeAssertionDigest(
        address author,
        bytes32 dataHash,
        uint256 startBlock,
        bytes32 startBlockHash
    ) public pure returns (bytes32) {
        bytes32 structHash = keccak256(
            abi.encode(
                keccak256("ChronoprobeAssertion(address author,bytes32 dataHash,uint256 startBlock,bytes32 startBlockHash)"),
                author,
                dataHash,
                startBlock,
                startBlockHash
            )
        );
        return MessageHashUtils.toEthSignedMessageHash(structHash);
    }

    /**
     * @notice Comprehensive on-chain interval and authorship verifier using struct input.
     */
    function verifyIntervalProof(
        bytes32 root,
        AssertionInput calldata input,
        bytes32[] calldata proof
    )
        external
        view
        returns (
            bool valid,
            uint256 endBlock,
            uint256 endTimestamp,
            address publisher
        )
    {
        Anchor memory anchor = anchors[root];
        if (anchor.blockNumber == 0) {
            return (false, 0, 0, address(0));
        }

        // Temporal monotonicity check: startBlock must be strictly before the anchoring block
        if (input.startBlock >= anchor.blockNumber) {
            return (false, anchor.blockNumber, anchor.timestamp, anchor.publisher);
        }

        // Verify author signature
        bytes32 digest = computeAssertionDigest(
            input.author,
            input.dataHash,
            input.startBlock,
            input.startBlockHash
        );
        address recovered = ECDSA.recover(digest, input.signature);
        if (recovered != input.author) {
            return (false, anchor.blockNumber, anchor.timestamp, anchor.publisher);
        }

        // Verify Merkle tree inclusion
        bytes32 leaf = computeLeaf(
            input.author,
            input.dataHash,
            input.startBlock,
            input.startBlockHash,
            input.signature
        );
        if (!MerkleProof.verify(proof, root, leaf)) {
            return (false, anchor.blockNumber, anchor.timestamp, anchor.publisher);
        }

        return (true, anchor.blockNumber, anchor.timestamp, anchor.publisher);
    }
}
