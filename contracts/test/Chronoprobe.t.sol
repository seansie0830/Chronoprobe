// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test, console} from "forge-std/Test.sol";
import {Chronoprobe} from "../src/Chronoprobe.sol";

contract ChronoprobeTest is Test {
    Chronoprobe public chronoprobe;

    // Use fresh random private keys (NOT well-known defaults)
    uint256 internal alicePk;
    address internal alice;

    uint256 internal bobPk;
    address internal bob;

    function setUp() public {
        chronoprobe = new Chronoprobe();

        // Fresh random keys
        alicePk = 0xA11CE01928374650192837465019283746501928374650192837465019283746;
        alice = vm.addr(alicePk);

        bobPk = 0xB0B0E01928374650192837465019283746501928374650192837465019283746;
        bob = vm.addr(bobPk);

        vm.deal(alice, 10 ether);
        vm.deal(bob, 10 ether);
    }

    function test_CommitRootAndQuery() public {
        bytes32 testRoot = keccak256("test_merkle_root_1");

        vm.roll(100);
        vm.warp(1700000000);

        (uint256 blockNum, uint256 timestamp) = chronoprobe.commitRoot(testRoot);

        assertEq(blockNum, 100);
        assertEq(timestamp, 1700000000);
        assertTrue(chronoprobe.isAnchored(testRoot));
        assertEq(chronoprobe.getRootCount(), 1);

        (uint256 bNum, uint256 ts, address pub) = chronoprobe.anchors(testRoot);
        assertEq(bNum, 100);
        assertEq(ts, 1700000000);
        assertEq(pub, address(this));
    }

    function test_CannotCommitDuplicateRoot() public {
        bytes32 testRoot = keccak256("test_merkle_root_dup");
        chronoprobe.commitRoot(testRoot);

        vm.expectRevert(abi.encodeWithSelector(Chronoprobe.RootAlreadyAnchored.selector, testRoot));
        chronoprobe.commitRoot(testRoot);
    }

    function test_SingleLeafIntervalProof() public {
        // Step 1: Alice creates an assertion at startBlock = 50
        uint256 startBlock = 50;
        bytes32 startBlockHash = keccak256(abi.encodePacked("blockhash_50"));
        bytes32 messageHash = keccak256("Hello, verifiable world!");

        bytes32 digest = chronoprobe.computeAssertionDigest(alice, messageHash, startBlock, startBlockHash);
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(alicePk, digest);
        bytes memory sig = abi.encodePacked(r, s, v);

        // Single leaf tree -> leaf == root
        bytes32 leaf = chronoprobe.computeLeaf(alice, messageHash, startBlock, startBlockHash, sig);
        bytes32 root = leaf;

        // Step 2: Coordinator commits root at endBlock = 75
        vm.roll(75);
        vm.warp(1700000500);
        chronoprobe.commitRoot(root);

        // Step 3: Verify interval proof
        bytes32[] memory emptyProof = new bytes32[](0);
        Chronoprobe.AssertionInput memory input = Chronoprobe.AssertionInput({
            author: alice,
            dataHash: messageHash,
            startBlock: startBlock,
            startBlockHash: startBlockHash,
            signature: sig
        });

        (bool valid, uint256 endBlock, uint256 endTimestamp, address publisher) = chronoprobe.verifyIntervalProof(
            root,
            input,
            emptyProof
        );

        assertTrue(valid);
        assertEq(endBlock, 75);
        assertEq(endTimestamp, 1700000500);
        assertEq(publisher, address(this));
    }

    function test_TwoLeavesMerkleProof() public {
        // Leaf 1: Alice
        uint256 startBlockA = 10;
        bytes32 hashA = keccak256(abi.encodePacked("block_10"));
        bytes32 msgA = keccak256("Alice message");
        bytes32 digestA = chronoprobe.computeAssertionDigest(alice, msgA, startBlockA, hashA);
        (uint8 vA, bytes32 rA, bytes32 sA) = vm.sign(alicePk, digestA);
        bytes memory sigA = abi.encodePacked(rA, sA, vA);
        bytes32 leafA = chronoprobe.computeLeaf(alice, msgA, startBlockA, hashA, sigA);

        // Leaf 2: Bob
        uint256 startBlockB = 12;
        bytes32 hashB = keccak256(abi.encodePacked("block_12"));
        bytes32 msgB = keccak256("Bob message");
        bytes32 digestB = chronoprobe.computeAssertionDigest(bob, msgB, startBlockB, hashB);
        (uint8 vB, bytes32 rB, bytes32 sB) = vm.sign(bobPk, digestB);
        bytes memory sigB = abi.encodePacked(rB, sB, vB);
        bytes32 leafB = chronoprobe.computeLeaf(bob, msgB, startBlockB, hashB, sigB);

        // Standard OpenZeppelin sorted pair hashing:
        bytes32 root = _hashPair(leafA, leafB);

        // Commit at block 30
        vm.roll(30);
        vm.warp(1700001000);
        chronoprobe.commitRoot(root);

        // Proof for leafA has sibling leafB
        bytes32[] memory proofA = new bytes32[](1);
        proofA[0] = leafB;

        Chronoprobe.AssertionInput memory inputA = Chronoprobe.AssertionInput({
            author: alice,
            dataHash: msgA,
            startBlock: startBlockA,
            startBlockHash: hashA,
            signature: sigA
        });

        (bool validA, uint256 endA,,) = chronoprobe.verifyIntervalProof(
            root, inputA, proofA
        );
        assertTrue(validA);
        assertEq(endA, 30);

        // Proof for leafB has sibling leafA
        bytes32[] memory proofB = new bytes32[](1);
        proofB[0] = leafA;

        Chronoprobe.AssertionInput memory inputB = Chronoprobe.AssertionInput({
            author: bob,
            dataHash: msgB,
            startBlock: startBlockB,
            startBlockHash: hashB,
            signature: sigB
        });

        (bool validB, uint256 endB,,) = chronoprobe.verifyIntervalProof(
            root, inputB, proofB
        );
        assertTrue(validB);
        assertEq(endB, 30);
    }

    function test_RevertInvalidIntervalWhenStartBlockAfterAnchor() public {
        uint256 startBlock = 100;
        bytes32 startBlockHash = keccak256("block_100");
        bytes32 msgHash = keccak256("Invalid time order");

        bytes32 digest = chronoprobe.computeAssertionDigest(alice, msgHash, startBlock, startBlockHash);
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(alicePk, digest);
        bytes memory sig = abi.encodePacked(r, s, v);
        bytes32 leaf = chronoprobe.computeLeaf(alice, msgHash, startBlock, startBlockHash, sig);

        // Root committed earlier than startBlock (e.g. block 80)
        vm.roll(80);
        chronoprobe.commitRoot(leaf);

        bytes32[] memory emptyProof = new bytes32[](0);
        Chronoprobe.AssertionInput memory input = Chronoprobe.AssertionInput({
            author: alice,
            dataHash: msgHash,
            startBlock: startBlock,
            startBlockHash: startBlockHash,
            signature: sig
        });

        (bool valid,,,) = chronoprobe.verifyIntervalProof(
            leaf, input, emptyProof
        );
        assertFalse(valid, "Should fail when startBlock >= anchor block");
    }

    function test_RevertForgedAuthorSignature() public {
        uint256 startBlock = 20;
        bytes32 startBlockHash = keccak256("block_20");
        bytes32 msgHash = keccak256("Forged message");

        // Alice digest signed by Bob (impersonation attempt)
        bytes32 digest = chronoprobe.computeAssertionDigest(alice, msgHash, startBlock, startBlockHash);
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(bobPk, digest);
        bytes memory forgedSig = abi.encodePacked(r, s, v);

        bytes32 leaf = chronoprobe.computeLeaf(alice, msgHash, startBlock, startBlockHash, forgedSig);

        vm.roll(50);
        chronoprobe.commitRoot(leaf);

        bytes32[] memory emptyProof = new bytes32[](0);
        Chronoprobe.AssertionInput memory input = Chronoprobe.AssertionInput({
            author: alice,
            dataHash: msgHash,
            startBlock: startBlock,
            startBlockHash: startBlockHash,
            signature: forgedSig
        });

        (bool valid,,,) = chronoprobe.verifyIntervalProof(
            leaf, input, emptyProof
        );
        assertFalse(valid, "Signature recovery must match claimed author");
    }

    function _hashPair(bytes32 a, bytes32 b) internal pure returns (bytes32) {
        return a < b ? keccak256(abi.encodePacked(a, b)) : keccak256(abi.encodePacked(b, a));
    }
}
