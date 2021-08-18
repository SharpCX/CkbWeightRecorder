import Web3 from 'web3';
import * as WeightRecorderJSON from '../../../build/contracts/WeightRecorder.json';
import { WeightRecorder } from '../../types/WeightRecorder';

const DEFAULT_SEND_OPTIONS = {
    gas: 6000000
};

export class SimpleStorageWrapper {
    web3: Web3;

    contract: WeightRecorder;

    address: string;

    constructor(web3: Web3) {
        this.web3 = web3;
        this.contract = new web3.eth.Contract(WeightRecorderJSON.abi as any) as any;
    }

    get isDeployed() {
        return Boolean(this.address);
    }

    async getRecords(fromAddress: string) {
        const data = await this.contract.methods.getRecords().call({ from: fromAddress });

        return data;
    }

    async setWeight(timeString: string, weight: number, fromAddress: string) {
        const tx = await this.contract.methods.record(timeString, weight).send({
            ...DEFAULT_SEND_OPTIONS,
            from: fromAddress
        });

        return tx;
    }

    async deploy(fromAddress: string) {
        const tx = this.contract
            .deploy({
                data: WeightRecorderJSON.bytecode,
                arguments: []
            })
            .send({
                ...DEFAULT_SEND_OPTIONS,
                from: fromAddress
            });

        let transactionHash: string = null;
        tx.on('transactionHash', (hash: string) => {
            transactionHash = hash;
        });

        const contract = await tx;

        this.useDeployed(contract.options.address);

        return transactionHash;
    }

    useDeployed(contractAddress: string) {
        this.address = contractAddress;
        this.contract.options.address = contractAddress;
    }
}
