// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {Chronoprobe} from "../src/Chronoprobe.sol";

contract DeployScript is Script {
    function run() external returns (Chronoprobe chronoprobe) {
        // Safe deployment key resolution:
        // Try reading PRIVATE_KEY from environment, otherwise fallback to local fresh key
        uint256 deployerPrivateKey;
        try vm.envUint("PRIVATE_KEY") returns (uint256 key) {
            deployerPrivateKey = key;
        } catch {
            // Local dev fallback (fresh pseudo-random key for Anvil testing)
            deployerPrivateKey = 0xA77A912837465019283746501928374650192837465019283746501928374650;
        }

        address deployer = vm.addr(deployerPrivateKey);
        console.log("Deploying Chronoprobe with account:", deployer);

        vm.startBroadcast(deployerPrivateKey);
        chronoprobe = new Chronoprobe();
        vm.stopBroadcast();

        console.log("Chronoprobe deployed to:", address(chronoprobe));
    }
}
