import Web3 from 'web3';

// Объявляем глобальный тип для window.ethereum
declare global {
  interface Window {
    ethereum: any;
  }
}

const abi: any = '';
const contractAddress: string = '';

async function loadCampaign(): Promise<void> {
  const urlParams = new URLSearchParams(window.location.search);
  const id: string | null = urlParams.get("id");

  if (window.ethereum && id) {
    const web3 = new Web3(window.ethereum);
    await window.ethereum.request({ method: "eth_requestAccounts" });
    const contract = new web3.eth.Contract(abi, contractAddress);
    const campaign: any = await contract.methods.campaigns(id).call();
    const campaignInfo = document.getElementById("campaignInfo");

    if (campaignInfo) {
      campaignInfo.innerHTML = `
        <h2>Campaign ${id}</h2>
        <p>Creator: ${campaign.creator}</p>
        <p>Goal: ${web3.utils.fromWei(campaign.goal, 'ether')} ETH</p>
        <p>Raised: ${web3.utils.fromWei(campaign.raised, 'ether')} ETH</p>
        <p>Deadline: ${new Date(parseInt(campaign.deadline) * 1000).toLocaleString()}</p>
      `;
    }

    document.getElementById("contributeForm")?.addEventListener("submit", async (e: Event) => {
      e.preventDefault();
      const accounts: string[] = await web3.eth.getAccounts();
      const amountInput = document.getElementById("amount") as HTMLInputElement;
      const amount: string = web3.utils.toWei(amountInput.value, 'ether');
      await contract.methods.contribute(id).send({ from: accounts[0], value: amount });
      loadCampaign(); // Обновляем данные после внесения вклада
    });
  } else {
    alert("Please install MetaMask or provide a campaign ID!");
  }
}

window.onload = loadCampaign;