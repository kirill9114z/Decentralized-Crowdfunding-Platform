// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract Campaign is ReentrancyGuard {
    using SafeMath for uint256;

    // Структура для хранения данных о кампании
    struct CampaignData {
        address creator;        // Создатель кампании
        uint goal;              // Цель сбора средств в wei
        uint deadline;          // Дедлайн в формате timestamp
        uint raised;            // Собранная сумма
        bool completed;         // Флаг завершения кампании
        mapping(address => uint) contributions; // Вклады пользователей
    }

    // Маппинг для хранения всех кампаний по ID
    mapping(uint => CampaignData) public campaigns;
    uint public campaignCount;  // Счётчик кампаний

    // События для отслеживания действий
    event CampaignCreated(uint id, address creator, uint goal, uint deadline);
    event FundsContributed(uint id, address contributor, uint amount);
    event FundsWithdrawn(uint id, address creator, uint amount);
    event RefundIssued(uint id, address contributor, uint amount);

    // Функция для создания новой кампании
    function createCampaign(uint _goal, uint _duration) external {
        require(_goal > 0, "Goal must be greater than 0");
        campaignCount++;
        CampaignData storage newCampaign = campaigns[campaignCount];
        newCampaign.creator = msg.sender;
        newCampaign.goal = _goal;
        newCampaign.deadline = block.timestamp.add(_duration);
        newCampaign.raised = 0;
        newCampaign.completed = false;
        emit CampaignCreated(campaignCount, msg.sender, _goal, newCampaign.deadline);
    }

    // Функция для внесения средств в кампанию
    function contribute(uint _campaignId) external payable nonReentrant {
        CampaignData storage campaign = campaigns[_campaignId];
        require(block.timestamp < campaign.deadline, "Campaign has ended");
        require(!campaign.completed, "Campaign is already completed");
        require(msg.value > 0, "Contribution must be greater than 0");

        campaign.raised = campaign.raised.add(msg.value);
        campaign.contributions[msg.sender] = campaign.contributions[msg.sender].add(msg.value);
        emit FundsContributed(_campaignId, msg.sender, msg.value);
    }

    // Функция для вывода средств создателем, если цель достигнута
    function withdrawFunds(uint _campaignId) external nonReentrant {
        CampaignData storage campaign = campaigns[_campaignId];
        require(msg.sender == campaign.creator, "Only creator can withdraw");
        require(block.timestamp >= campaign.deadline, "Campaign is still active");
        require(campaign.raised >= campaign.goal, "Goal not reached");
        require(!campaign.completed, "Funds already withdrawn");

        campaign.completed = true;
        uint amount = campaign.raised;
        campaign.raised = 0;
        payable(msg.sender).transfer(amount);
        emit FundsWithdrawn(_campaignId, msg.sender, amount);
    }

    // Функция для возврата средств вкладчикам, если цель не достигнута
    function refund(uint _campaignId) external nonReentrant {
        CampaignData storage campaign = campaigns[_campaignId];
        require(block.timestamp >= campaign.deadline, "Campaign is still active");
        require(campaign.raised < campaign.goal, "Goal reached, no refunds");
        require(campaign.contributions[msg.sender] > 0, "No contribution to refund");

        uint amount = campaign.contributions[msg.sender];
        campaign.contributions[msg.sender] = 0;
        payable(msg.sender).transfer(amount);
        emit RefundIssued(_campaignId, msg.sender, amount);
    }
}