// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {FunctionsClient} from "@chainlink/contracts/src/v0.8/functions/v1_0_0/FunctionsClient.sol";
import {ConfirmedOwner} from "@chainlink/contracts/src/v0.8/access/ConfirmedOwner.sol";
import {FunctionsRequest} from "@chainlink/contracts/src/v0.8/functions/v1_0_0/libraries/FunctionsRequest.sol";

contract PlantyDataConsumer is FunctionsClient, ConfirmedOwner {
    using FunctionsRequest for FunctionsRequest.Request;

    bytes32 public s_lastRequestId;
    bytes public s_lastResponse;
    bytes public s_lastError;

    struct PlantData {
        uint256 humidity;
        uint256 wateringInterval;
        uint256 temperature;
        string timestamp;
        string plantType;
    }

    PlantData public plantData;

    uint32 constant CALLBACK_GAS_LIMIT = 300000;
    address private constant ROUTER = 0xb83E47C2bC239B3bf370bc41e1459A34b41238D0;
    bytes32 private constant DON_ID =
        0x66756e2d657468657265756d2d7365706f6c69612d3100000000000000000000;

    string constant source = string(
        abi.encodePacked(
            "const apiResponse = await Functions.makeHttpRequest({",
            "  url: 'https://planty-server.onrender.com/plant-data'",
            "});",
            "if (!apiResponse || apiResponse.error) {",
            "  throw new Error('Request failed');",
            "}",
            "const data = apiResponse.data;",
            "return Functions.encodeABI(",
            "  ['uint256', 'uint256', 'uint256', 'string', 'string'],",
            "  [data.humidity, data.wateringInterval, data.temperature, data.timestamp, data.plantType]",
            ");"
        )
    );

    event RequestSent(bytes32 indexed requestId);
    event ResponseReceived(bytes32 indexed requestId, bytes response, bytes err);

    constructor() FunctionsClient(ROUTER) ConfirmedOwner(msg.sender) {}

    function requestPlantData(uint64 subscriptionId) external onlyOwner returns (bytes32 requestId) {
        FunctionsRequest.Request memory req;
        req.initializeRequestForInlineJavaScript(source);
        requestId = _sendRequest(req.encodeCBOR(), subscriptionId, CALLBACK_GAS_LIMIT, DON_ID);
        s_lastRequestId = requestId;
        emit RequestSent(requestId);
    }

    function fulfillRequest(
        bytes32 requestId,
        bytes memory response,
        bytes memory err
    ) internal override {
        if (err.length > 0) {
            s_lastError = err;
        } else {
            (
                uint256 humidity,
                uint256 wateringInterval,
                uint256 temperature,
                string memory timestamp,
                string memory plantType
            ) = abi.decode(response, (uint256, uint256, uint256, string, string));

            plantData = PlantData(humidity, wateringInterval, temperature, timestamp, plantType);
            s_lastResponse = response;
        }
        emit ResponseReceived(requestId, response, err);
    }
}
