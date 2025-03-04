import { expect } from "chai";
import { ethers } from "hardhat";
import { Contract, ContractFactory, Signer } from "ethers";

describe("Campaign Contract", function () {
  let Campaign: ContractFactory;
  let campaign: Contract;
  let owner: Signer;
  let addr1: Signer;
  let addr2: Signer;

  // Подготовка перед каждым тестом
  beforeEach(async function () {
    // Получаем адреса для тестирования
    [owner, addr1, addr2] = await ethers.getSigners();
    // Получаем фабрику контракта
    Campaign = await ethers.getContractFactory("Campaign");
    // Деплоим контракт
    campaign = await Campaign.deploy();
    await campaign.deployed();
  });

  // Тест 1: Создание кампании
  it("Должна создаваться кампания", async function () {
    await campaign.createCampaign(ethers.utils.parseEther("1"), 3600);
    const campaignData = await campaign.campaigns(1);
    expect(campaignData.creator).to.equal(await owner.getAddress());
    expect(campaignData.goal).to.equal(ethers.utils.parseEther("1"));
  });

  // Тест 2: Внесение средств
  it("Должны приниматься взносы", async function () {
    await campaign.createCampaign(ethers.utils.parseEther("1"), 3600);
    await campaign.connect(addr1).contribute(1, { value: ethers.utils.parseEther("0.5") });
    const campaignData = await campaign.campaigns(1);
    expect(campaignData.raised).to.equal(ethers.utils.parseEther("0.5"));
  });

  // Тест 3: Вывод средств при достижении цели
  it("Должен разрешаться вывод средств при достижении цели", async function () {
    await campaign.createCampaign(ethers.utils.parseEther("1"), 3600);
    await campaign.connect(addr1).contribute(1, { value: ethers.utils.parseEther("1") });
    // Увеличиваем время, чтобы кампания завершилась
    await ethers.provider.send("evm_increaseTime", [3601]);
    await campaign.withdrawFunds(1);
    const campaignData = await campaign.campaigns(1);
    expect(campaignData.completed).to.be.true;
  });

  // Тест 4: Возврат средств, если цель не достигнута
  it("Должен разрешаться возврат средств, если цель не достигнута", async function () {
    await campaign.createCampaign(ethers.utils.parseEther("1"), 3600);
    await campaign.connect(addr1).contribute(1, { value: ethers.utils.parseEther("0.5") });
    // Увеличиваем время, чтобы кампания завершилась
    await ethers.provider.send("evm_increaseTime", [3601]);
    await campaign.connect(addr1).refund(1);
    const campaignData = await campaign.campaigns(1);
    expect(campaignData.contributions[await addr1.getAddress()]).to.equal(0);
  });
});