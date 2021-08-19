/* eslint-disable @typescript-eslint/camelcase */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable */

import React, { useEffect, useState } from 'react';
import Web3 from 'web3';
import { ToastContainer, toast } from 'react-toastify';
import './app.scss';
import 'react-toastify/dist/ReactToastify.css';
import { PolyjuiceHttpProvider } from '@polyjuice-provider/web3';
import { AddressTranslator } from 'nervos-godwoken-integration';

import { WeightRecorderWrapper } from '../lib/contracts/WeightRecorderWrapper';
import { CXTokenWrapper } from '../lib/contracts/CXTokenWrapper';
import { CONFIG } from '../config';
import { Accordion, AccordionDetails, AccordionSummary, Button, TextField, Typography } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';

import {
    ResponsiveContainer, LineChart, Line, XAxis, YAxis, ReferenceLine, ReferenceArea,
    ReferenceDot, Tooltip, CartesianGrid, Legend, Brush, ErrorBar, AreaChart, Area,
    Label, LabelList
} from 'recharts';

const useStyles = makeStyles((theme) => ({
    root: {
        '& > *': {
            margin: theme.spacing(1),
            width: '25ch'
        }
    },
    heading: {
        fontSize: theme.typography.pxToRem(15),
        fontWeight: theme.typography.fontWeightRegular,
    },
}));

async function createWeb3() {

    // Modern dapp browsers...
    if ((window as any).ethereum) {
        const godwokenRpcUrl = CONFIG.WEB3_PROVIDER_URL;
        const providerConfig = {
            rollupTypeHash: CONFIG.ROLLUP_TYPE_HASH,
            ethAccountLockCodeHash: CONFIG.ETH_ACCOUNT_LOCK_CODE_HASH,
            web3Url: godwokenRpcUrl
        };

        const provider = new PolyjuiceHttpProvider(godwokenRpcUrl, providerConfig);
        const web3 = new Web3(provider || Web3.givenProvider);

        try {
            // Request account access if needed
            await (window as any).ethereum.enable();
        } catch (error) {
            // User denied account access...
        }

        return web3;
    }

    console.log('Non-Ethereum browser detected. You should consider trying MetaMask!');
    return null;
}

interface IWeightItem {
    dateString: string;
    weight: number;
}

export function App() {
    const classes = useStyles();


    const weightDataDefault = [
        {
            dateString: '2020-01-01',
            weight: 0
        }
    ];

    const [web3, setWeb3] = useState<Web3>(null);
    const [contract, setContract] = useState<WeightRecorderWrapper>();
    const [accounts, setAccounts] = useState<string[]>();
    const [l2Balance, setL2Balance] = useState<bigint>();
    const [existingContractIdInputValue, setExistingContractIdInputValue] = useState<string>();
    const [storedValue, setStoredValue] = useState<number | undefined>();
    const [deployTxHash, setDeployTxHash] = useState<string | undefined>();
    const [polyjuiceAddress, setPolyjuiceAddress] = useState<string | undefined>();
    const [transactionInProgress, setTransactionInProgress] = useState(false);
    const toastId = React.useRef(null);
    const [newStoredNumberInputValue, setNewStoredNumberInputValue] = useState<number | undefined>();
    const [newStoredDateInputValue, setNewStoredDateInputValue] = useState<string | undefined>();
    const [weightDatax, setWeightDatax] = useState<IWeightItem[]>(weightDataDefault);

    const [existingTokenContractIdInputValue, setExistingTokenContractIdInputValue] = useState<string>();
    const [tokenContract, setTokenContract] = useState<CXTokenWrapper>();
    const [deployTokenTxHash, setDeployTokenTxHash] = useState<string | undefined>();
    const [deployTokenContractAddress, setDeployTokenContractAddress] = useState<string | undefined>();
    const [depositAddress, setDepositAddress] = useState<string | undefined>();
    const [tokenSymbol, setTokenSymbol] = useState<string | undefined>();
    const [tokenName, setTokenName] = useState<string | undefined>();
    const [tokenSupply, setTokenSupply] = useState<string | undefined>();
    const [cXTokenBalance, setCXTokenBalance] = useState<string | undefined>();
    const [balanceOfAddress, setBalanceOfAddress] = useState<string | undefined>();
    const [inputAddressToGet, setInputAddressToGet] = useState<string | undefined>();

    useEffect(() => {
        if (accounts?.[0]) {
            const addressTranslator = new AddressTranslator();
            setPolyjuiceAddress(addressTranslator.ethAddressToGodwokenShortAddress(accounts?.[0]));
            setExistingContractAddress('0x9D1E1fb351d9b94B6429d4cB315374142A8E3D52');
            // 0xA722199Bbcc424F35991C3b071FD5eEa98aD209F
            //
            setExistingTokenContractAddress('0x67a912BB1322F0e65b15066B135F3A1ae3A985aD');
        } else {
            setPolyjuiceAddress(undefined);
        }
    }, [accounts?.[0]]);

    useEffect(() => {
        if (web3 && polyjuiceAddress && accounts) {
            // getLayer2Balances();
            refreshChart();
        }
    }, [web3, polyjuiceAddress, accounts]);

    useEffect(() => {
        if (web3 && polyjuiceAddress && accounts) {
            (async ()=>{
                setTokenName(await tokenContract.getTokenName());
                setTokenSymbol(await tokenContract.getTokenSymbol());
                setTokenSupply(await tokenContract.getTotalSupply());
                setCXTokenBalance(await tokenContract.getBalanceOf(accounts?.[0]));
            })();
        }
    }, [web3, polyjuiceAddress, accounts, tokenContract]);

    useEffect(() => {
        if (transactionInProgress && !toastId.current) {
            toastId.current = toast.info(
                'Transaction in progress. Confirm MetaMask signing dialog and please wait...',
                {
                    position: 'top-right',
                    autoClose: false,
                    hideProgressBar: false,
                    closeOnClick: false,
                    pauseOnHover: true,
                    draggable: true,
                    progress: undefined,
                    closeButton: false
                }
            );
        } else if (!transactionInProgress && toastId.current) {
            toast.dismiss(toastId.current);
            toastId.current = null;
        }
    }, [transactionInProgress, toastId.current]);

    const account = accounts?.[0];

    async function deployTokenContract() {
        const _token_contract = new CXTokenWrapper(web3);

        try {
            setDeployTokenTxHash(undefined);

            const transactionHash = await _token_contract.deploy(account);
            setDeployTokenTxHash(transactionHash);
            setDeployTokenContractAddress(_token_contract.address);
            setExistingTokenContractAddress(_token_contract.address);
            toast(
                'Successfully deployed a smart-contract. You can now proceed to get or set the value in a smart contract.',
                { type: 'success' }
            );
        } catch (error) {
            console.error(error);
            toast.error(
                'There was an error sending your transaction. Please check developer console.'
            );
        } finally {
            setTransactionInProgress(false);
        }
    }

    async function deployContract() {
        const _contract = new WeightRecorderWrapper(web3);

        try {
            setDeployTxHash(undefined);
            setTransactionInProgress(true);

            const transactionHash = await _contract.deploy(account);

            setDeployTxHash(transactionHash);
            setExistingContractAddress(_contract.address);
            toast(
                'Successfully deployed a smart-contract. You can now proceed to get or set the value in a smart contract.',
                { type: 'success' }
            );
        } catch (error) {
            console.error(error);
            toast.error(
                'There was an error sending your transaction. Please check developer console.'
            );
        } finally {
            setTransactionInProgress(false);
        }
    }

    async function getStoredValue() {
        const value = await contract.getRecords(account);
        console.log('=======================');
        console.log(value);
        toast('Successfully read latest stored value.', { type: 'success' });

        setStoredValue(123);
    }

    async function setExistingContractAddress(contractAddress: string) {
        const _contract = new WeightRecorderWrapper(web3);
        _contract.useDeployed(contractAddress.trim());

        setContract(_contract);
        setStoredValue(undefined);
    }

    async function setExistingTokenContractAddress(contractAddress: string) {
        const _token_contract = new CXTokenWrapper(web3);
        _token_contract.useDeployed(contractAddress.trim());

        setTokenContract(_token_contract);
    }

    async function setNewStoredValue() {
        try {
            setTransactionInProgress(true);
            // await contract.setStoredValue(newStoredNumberInputValue, account);
            await contract.setWeight(newStoredDateInputValue, newStoredNumberInputValue, account);
            toast(
                'Successfully set latest stored value. You can refresh the read value now manually.',
                { type: 'success' }
            );
        } catch (error) {
            console.error(error);
            toast.error(
                'There was an error sending your transaction. Please check developer console.'
            );
        } finally {
            setTransactionInProgress(false);
        }
    }

    async function refreshChart() {
        const weightRet = await contract.getRecords(account);

        let dateArray = weightRet['0'];
        let weightArray = weightRet['1'];
        console.log(dateArray);
        console.log(weightArray);
        type ComposeMapType = Record<string, number>;
        let composeMap: ComposeMapType = {};

        for (let index = 0; index < dateArray.length; index++) {
            composeMap[dateArray[index]] = parseInt(weightArray[index]);
        }
        // dateArray = dateArray.sort()

        let result: IWeightItem[] = [];
        for (let index = 0; index < dateArray.length; index++) {
            result.push({
                dateString: dateArray[index],
                weight: parseInt(weightArray[index])
            });
        }
        console.log(result);
        setWeightDatax(result);
    }

    useEffect(() => {
        if (web3) {
            return;
        }

        (async () => {
            const _web3 = await createWeb3();
            setWeb3(_web3);

            const _accounts = [(window as any).ethereum.selectedAddress];
            setAccounts(_accounts);
            console.log({ _accounts });

            if (_accounts && _accounts[0]) {
                const _l2Balance = BigInt(await _web3.eth.getBalance(_accounts[0]));
                setL2Balance(_l2Balance);
            }
        })();
    });

    async function getBalance() {
        const value = await tokenContract.getBalanceOf(inputAddressToGet);
        console.log("geting balance"+inputAddressToGet)
        console.log("geting balance"+value)
        setBalanceOfAddress(value);
    }

    useEffect(() => {
        if (accounts?.[0]) {
            const addressTranslator = new AddressTranslator();
            setPolyjuiceAddress(addressTranslator.ethAddressToGodwokenShortAddress(accounts?.[0]));
            addressTranslator
                .getLayer2DepositAddress(web3, (window as any).ethereum.selectedAddress)
                .then(depositAddr => {
                    setDepositAddress(depositAddr.addressString);
                });
        } else {
            setPolyjuiceAddress(undefined);
        }
    }, [accounts?.[0]])

    const LoadingIndicator = () => <span className='rotating-icon'>⚙️</span>;

    // @ts-ignore
    // @ts-ignore
    return (
        <div>
            Hello~ Eth: <b> {accounts?.[0]}</b> <br/><br />
            Ployjuice: <b> {polyjuiceAddress || ' - '}</b> <br/><br />
            Deposit address: <b>{depositAddress || '-'}</b> <br /><br />
            <br />
            Yor Balance:{' '} <b>{l2Balance ? (l2Balance / 10n ** 8n).toString() : <LoadingIndicator />} CKB</b>

            <br />
            <Accordion>
                <AccordionSummary
                    expandIcon={<ExpandMoreIcon />}
                    aria-controls='panel1a-content'
                    id='panel1a-header'
                >
                    <Typography className={classes.heading}>Deploy Weight Recorder Contract</Typography>
                </AccordionSummary>
                <AccordionDetails>
                    <div>
                        Deployed contract address: <b>{contract?.address || '-'}</b> <br />
                        Deploy transaction hash: <b>{deployTxHash || '-'}</b>
                        <br />
                        <hr />
                        <button onClick={deployContract} disabled={!l2Balance}>
                            Deploy contract
                        </button>
                        &nbsp;or&nbsp;
                        <input
                            placeholder='Existing contract id'
                            onChange={e => setExistingContractIdInputValue(e.target.value)}
                        />
                        <button
                            disabled={!existingContractIdInputValue || !l2Balance}
                            onClick={() => setExistingContractAddress(existingContractIdInputValue)}
                        >
                            Use existing contract
                        </button>
                        <br />
                        <br />
                        <button onClick={getStoredValue} disabled={!contract}>
                            Get stored value
                        </button>
                        {storedValue ? <>&nbsp;&nbsp;Stored value: {storedValue.toString()}</> : null}
                        <br />
                        <br />
                        <hr />
                    </div>
                </AccordionDetails>
            </Accordion>
            <Accordion expanded={true}>
                <AccordionSummary
                    aria-controls='panel1a-content'
                    id='panel1a-header'
                >
                    <Typography className={classes.heading}>Deploy CXToken Contract</Typography>
                </AccordionSummary>
                <AccordionDetails>
                    <div>
                        Deployed token contract address: <b>{tokenContract?.address || '-'}</b> <br />
                        Deploy token transaction hash: <b>{deployTokenTxHash || '-'}</b> <br />
                        Token Symbol: <b>{tokenSymbol || '-'}</b> <br />
                        Token Name: <b>{tokenName || '-'}</b> <br />
                        Token supply: <b>{tokenSupply || '-'}</b> <br />
                        Token balance: <b>{cXTokenBalance || '-'}</b> <br />
                        <a href="https://force-bridge-test.ckbapp.dev/bridge/Ethereum/Nervos">Force Bridge</a>
                        . Please fill the Receiver address with your L2 Deposit address on the above.
                        <br/>

                        <input
                            placeholder='address to get token'
                            onChange={e=>setInputAddressToGet(e.target.value)}
                        />
                        <Button variant='contained' color='secondary'
                                onClick={getBalance}
                                disabled={!tokenContract}
                                >
                            Get Balance
                        </Button>
                         User Balance { balanceOfAddress || '-' }<br /><br />
                        <input
                            placeholder='Existing token contract id'
                            onChange={e => setExistingTokenContractIdInputValue(e.target.value)}
                        /><br /><br />
                        <Button variant='contained' color='secondary'
                                onClick={deployTokenContract}
                                disabled={!tokenContract}>
                            Deploy CX Token
                        </Button> &nbsp;&nbsp;&nbsp;&nbsp;
                        <Button variant='contained' color='secondary'
                                disabled={!existingTokenContractIdInputValue}
                                onClick={() => setExistingTokenContractAddress(existingContractIdInputValue)}
                                >
                            Use Exist
                        </Button>
                        <br/>

                    </div>
                </AccordionDetails>
            </Accordion>
            <div>
                <form className={classes.root} noValidate autoComplete='off'>
                    <TextField id='idWeight' label='Date like 2020-01-01' variant='outlined'
                               onChange={e => setNewStoredDateInputValue(e.target.value)} />
                    <TextField id='idWeight' label='Input Your Weight' variant='outlined'
                               onChange={e => setNewStoredNumberInputValue(parseInt(e.target.value, 10))} />
                    <br />
                    <Button variant='contained' color='primary' onClick={setNewStoredValue} disabled={!contract}>
                        Record My Weight
                    </Button>
                    <Button variant='contained' color='secondary' onClick={refreshChart} disabled={!contract}>
                        Refresh Chart
                    </Button>
                </form>
                <LineChart
                    width={800} height={400} data={weightDatax}
                    margin={{ top: 40, right: 40, bottom: 20, left: 20 }}
                >
                    <CartesianGrid vertical={false} />
                    <XAxis dataKey='dateString' label='' />
                    <YAxis dataKey='weight' domain={['auto', 'auto']} label='' />
                    <Tooltip
                        wrapperStyle={{
                            borderColor: 'white',
                            boxShadow: '2px 2px 3px 0px rgb(204, 204, 204)'
                        }}
                        contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.8)' }}
                        labelStyle={{ fontWeight: 'bold', color: '#666666' }}
                    />
                    <Line dataKey='weight' stroke='#ff7300' dot={true} />
                </LineChart>

            </div>
            <ToastContainer />


        </div>
    );
}
