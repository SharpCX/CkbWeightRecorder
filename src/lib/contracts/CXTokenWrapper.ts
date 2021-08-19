/* eslint-disable @typescript-eslint/no-explicit-any */
import Web3 from 'web3';
import * as CXTokenJSON from '../../../build/contracts/CXToken.json';
import { CXToken } from '../../types/CXToken';

const DEFAULT_SEND_OPTIONS = {
    gas: 6000000
};

// const SUDT_ID = '2475';
// const SUDT_NAME = 'SharpCxToken';
// const SUDT_SYMBOL = 'CX';
// const SUDT_TOTAL_SUPPLY = 100000000000000000000n;

export class CXTokenWrapper {
    web3: Web3;

    contract: CXToken;

    address: string;

    constructor(web3: Web3) {
        this.web3 = web3;
        this.contract = new web3.eth.Contract(CXTokenJSON.abi as any) as any;
    }

    get isDeployed() {
        return Boolean(this.address);
    }

    async getTotalSupply() {
        const value = await this.contract.methods.totalSupply().call();
        return value;
    }

    async getTokenSymbol() {
        const value = await this.contract.methods.symbol().call();
        return value;
    }

    async getTokenName() {
        const value = await this.contract.methods.name().call();
        return value;
    }

    async getBalanceOf(account: string) {
        const value = await this.contract.methods.balanceOf(account).call();
        return value;
    }

    async setTransferToken(fromAddress: string, toAddress: string, amount: number) {
        const tx = await this.contract.methods
            .transfer(toAddress, this.web3.utils.toWei(this.web3.utils.toBN(amount)))
            .send({
                ...DEFAULT_SEND_OPTIONS,
                from: fromAddress
            });

        return tx;
    }

    async deploy(fromAddress: string) {
        const deployTx = await (this.contract
            .deploy({
                data: CXTokenJSON.bytecode
                // arguments: [SUDT_NAME, SUDT_SYMBOL, SUDT_TOTAL_SUPPLY, SUDT_ID]
            })
            .send({
                ...DEFAULT_SEND_OPTIONS,
                from: fromAddress,
                to: '0x0000000000000000000000000000000000000000'
            } as any) as any);

        this.useDeployed(deployTx.contractAddress);

        return deployTx.transactionHash;
    }

    useDeployed(contractAddress: string) {
        this.address = contractAddress;
        this.contract.options.address = contractAddress;
    }
}