import Web3 from 'web3';

declare global {
  interface Window {
    ethereum: any;
  }
}

const abi: any = '';
const contractAddress: string = '';

async function loadCampaigns(): Promise<void> {
  if (window.ethereum) {
    const web3 = new Web3(window.ethereum);
    await window.ethereum.request({ method: "eth_requestAccounts" });
    const contract = new web3.eth.Contract(abi, contractAddress);
    const campaignCount: number = parseInt(await contract.methods.campaignCount().call());
    const campaignsDiv = document.getElementById("campaigns");

    if (campaignsDiv) {
      campaignsDiv.innerHTML = "";
      for (let i = 1; i <= campaignCount; i++) {
        const campaign: any = await contract.methods.campaigns(i).call();
        const campaignElement = document.createElement("div");
        campaignElement.innerHTML = `
          <h2>Campaign ${i}</h2>
          <p>Creator: ${campaign.creator}</p>
          <p>Goal: ${web3.utils.fromWei(campaign.goal, 'ether')} ETH</p>
          <p>Raised: ${web3.utils.fromWei(campaign.raised, 'ether')} ETH</p>
          <p>Deadline: ${new Date(parseInt(campaign.deadline) * 1000).toLocaleString()}</p>
          <button onclick="window.location.href='campaign.html?id=${i}'">View</button>
        `;
        campaignsDiv.appendChild(campaignElement);
      }
    }
  } else {
    alert("Please install MetaMask!");
  }
}

window.onload = loadCampaigns;