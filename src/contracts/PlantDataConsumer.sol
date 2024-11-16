// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "@chainlink/contracts/src/v0.8/ChainlinkClient.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract PlantDataConsumer is ChainlinkClient, Ownable {
    using Chainlink for Chainlink.Request;

    struct PlantData {
        uint256 humidity;
        uint256 wateringInterval;
        uint256 temperature;
        string timestamp;
        string plantType;
    }

    PlantData public plantData;

    address private oracle;
    uint256 private fee;
    bytes32 private jobId;

    event DataFetched(
        uint256 humidity,
        uint256 wateringInterval,
        uint256 temperature,
        string timestamp,
        string plantType
    );

    event RequestSent(bytes32 requestId);

    constructor(address _oracle, bytes32 _jobId, uint256 _fee, address _link) {
        setChainlinkToken(_link);
        oracle = _oracle;
        jobId = _jobId;
        fee = _fee; // 예: 0.1 LINK
    }

    function fetchPlantData() public onlyOwner returns (bytes32 requestId) {
        Chainlink.Request memory req = buildChainlinkRequest(jobId, address(this), this.fulfill.selector);

        // 요청할 API URL
        req.add("get", "https://planty-server.onrender.com/plant-data");

        // JSON 응답에서 필요한 데이터의 경로를 지정
        req.add("path_humidity", "humidity");
        req.add("path_wateringInterval", "wateringInterval");
        req.add("path_temperature", "temperature");
        req.add("path_timestamp", "timestamp");
        req.add("path_plantType", "plantType");

        // Chainlink 오라클에 요청
        requestId = sendChainlinkRequestTo(oracle, req, fee);
        emit RequestSent(requestId);
        return requestId;
    }

    // Chainlink 노드에서 응답을 받는 함수
    function fulfill(
        bytes32 _requestId,
        uint256 _humidity,
        uint256 _wateringInterval,
        uint256 _temperature,
        string memory _timestamp,
        string memory _plantType
    ) public recordChainlinkFulfillment(_requestId) {
        plantData = PlantData(_humidity, _wateringInterval, _temperature, _timestamp, _plantType);

        emit DataFetched(_humidity, _wateringInterval, _temperature, _timestamp, _plantType);
    }

    // LINK 잔액 조회
    function getLinkBalance() public view returns (uint256) {
        return LinkTokenInterface(chainlinkTokenAddress()).balanceOf(address(this));
    }

    // LINK 토큰 전송 (컨트랙트 소유자만 실행 가능)
    function transferLink(address recipient, uint256 amount) public onlyOwner {
        require(LinkTokenInterface(chainlinkTokenAddress()).transfer(recipient, amount), "Unable to transfer");
    }
}
