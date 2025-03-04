import Web3 from 'web3';

// Объявляем глобальный тип для window.ethereum
declare global {
  interface Window {
    ethereum: any;
  }
}

// Вставь ABI и адрес контракта
const abi: any = '';
const contractAddress: string = '';

document.getElementById("createForm")?.addEventListener("submit", async (e: Event) => {
  e.preventDefault();
  if (window.ethereum) {
    const web3 = new Web3(window.ethereum);
    await window.ethereum.request({ method: "eth_requestAccounts" });
    const accounts: string[] = await web3.eth.getAccounts();
    const contract = new web3.eth.Contract(abi, contractAddress);

    const goalInput = document.getElementById("goal") as HTMLInputElement;
    const durationInput = document.getElementById("duration") as HTMLInputElement;
    const goal: string = web3.utils.toWei(goalInput.value, 'ether');
    const duration: string = durationInput.value;

    await contract.methods.createCampaign(goal, duration).send({ from: accounts[0] });
    window.location.href = "index.html";
  } else {
    alert("Please install MetaMask!");
  }
});