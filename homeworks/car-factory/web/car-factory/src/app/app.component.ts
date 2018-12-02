import { Component, ViewChild } from '@angular/core';
import * as CarFactoryInterface from '../contracts_interface/CarFactory.json';
import * as ethers from 'ethers';
import { Web3Provider } from 'ethers/providers';
import { Buffer } from 'buffer';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {

  public title: string = 'car-factory';
  private infuraApiKey: string = 'abca6d1110b443b08ef271545f24b80d';
  public currentBlock: string;
  public carsLength: string;
  public detailsResult: Array<any>;
  public contractAddress: string = '0xf30C8592A564689C6d6a31672c810cd4784Da087';
  public ownerAddress: string = '0x648d1231303c281a8cbabbf06f6ec87bfa0da0bf';
  public carIndex: number = 0;
  public carOwner: string;
  public allCars: Promise<Array<any>>;
  private infuraProvider: ethers.providers.InfuraProvider;
  private deployedContract: ethers.Contract;
  private connectedContract: ethers.Contract;
  private loadingGetCarsByOwner: boolean = false;
  private loadingGetOwner: boolean = false;
  private loadingBuyCar: boolean = false;
  private web3: any;
  private buyCarName: string = '';
  private buyCarPrice: number = 0.51;
  private buyCarImage: string;
  private utils: any = ethers.utils;
  private balance: string;
  private walletJson: string;
  private wallet: ethers.Wallet;
  private ipfs: any;
  private reader: FileReader;
  @ViewChild('file') file;


  constructor() {
    this.ipfs = window['IpfsApi']('192.168.99.100', '5001');
    console.log('Ipfs: ', this.ipfs);
    this.infuraProvider = new ethers.providers.InfuraProvider('rinkeby', this.infuraApiKey);
    this.deployedContract = new ethers.Contract(this.contractAddress, CarFactoryInterface.abi, this.infuraProvider);
    this.initiateConnectedContract();
    this.getAllCars();
    this.balance = this.deployedContract.getBalance();
    this.walletJson = this.getWallet();
  }

  private async initiateConnectedContract() {
    if (!this.connectedContract) {
      const web3 = window["web3"] || {};
      const web3Provider = new ethers.providers.Web3Provider(web3.currentProvider);
      const signer = web3Provider.getSigner();
      this.connectedContract = await this.deployedContract.connect(signer);
    }
  }

  public async withdraw() {
    await this.connectedContract.withdraw();
  }

  public async getOwner(carIndex: number) {
    this.loadingGetOwner = true;
    try {
      this.carOwner = await this.deployedContract.carsOwner(carIndex);
    } finally {
      this.loadingGetOwner = false;
    }
  }

  public async uploadToIPFS() {
    console.log('___________Upload to: ', null);
    this.reader = new FileReader();
    this.reader.readAsArrayBuffer(this.file.nativeElement.files[0]);
    console.log('File: ', this.file.nativeElement.files[0]);
    this.reader.onloadend = async () => {
      const buf = new Buffer(this.reader.result as ArrayBuffer);
      const result = await this.ipfs.files.add(buf).then();
      this.buyCarImage = result[0].path;
    };
  }

  public async buyCar(carName: string, carPrice: Number, buyCarImage: string) {
    if (carPrice > 0.51) {
      throw new Error('Tooo much money. Car price should be less than 0.52 ETH');
    }

    this.loadingBuyCar = true;
    try {

      const tx = await this.connectedContract.buyCar(carName, buyCarImage, { value: this.utils.parseEther(carPrice.toString()) });
      console.log('Transaction: ', tx);
      const waitTx = await tx.wait();
      console.log('WaitTx: ', waitTx);
    } catch (ex) {
      console.log('Exception: ', ex);
    } finally {
      this.loadingBuyCar = false;
    }

    this.getAllCars();
  }
  public async takeOver(index: number, takeOverPrice: number) {
    console.log('Index: ', index);
    console.log('Take over price: ', takeOverPrice);
    const tx = await this.connectedContract.takeOverCar(index, { value: this.utils.parseEther(takeOverPrice) });
  }
  public async getAllCars() {
    const length = await this.deployedContract.getCarsLength();
    const requests: Array<Promise<any>> = new Array<Promise<any>>();
    const callback = this.deployedContract.getCarDetails;

    for (let index = 0; index < Number(length); index++) {
      requests.push(callback(index));
    }

    this.allCars = Promise.all(requests);
  }

  public async createWallet(encryptionKey: string) {
    const wallet = ethers.Wallet.createRandom();
    const encryptedJson = await wallet.encrypt(encryptionKey, callback);
    window.localStorage.setItem('wallet', encryptedJson);
    this.wallet = wallet;

    function callback(progress) {
      console.log('Decrypt: ' + progress * 100 + ' % completed');
    }
  }
  public getWallet(): string {
    const wallet: string = window.localStorage.getItem('wallet');
    return wallet;
  }

  public async decryptWallet(encryptedJson: string, encryptionKey: string) {
    console.log('Encypted Json: ', encryptedJson);
    const initialWallet = await ethers.Wallet.fromEncryptedJson(encryptedJson, encryptionKey);
    this.wallet = initialWallet.connect(this.infuraProvider);
    console.log('Initial wallet: ', initialWallet);
    // window.localStorage.setItem('wallet', encryptedJson);
  }

  public async getCarsByOwner(address) {
    this.loadingGetCarsByOwner = true;
    try {
      this.carsLength = await this.deployedContract.getCarsByOwner(address);
      const cars: Array<Promise<any>> = new Array<Promise<any>>();
      for (let index = 0; index < Number(this.carsLength); index++) {
        cars.push(this.deployedContract.allOwnedCars(address, index));
      }
      const result = await Promise.all(cars);

      const carDetails: Array<Promise<any>> = new Array<Promise<any>>();
      for (let index = 0; index < result.length; index++) {
        carDetails.push(this.deployedContract.getCarDetails(result[index]));
      }
      this.detailsResult = await Promise.all(carDetails);
    } catch (ex) {
      throw ex;
    } finally {
      this.loadingGetCarsByOwner = false;
    }
  }
}
