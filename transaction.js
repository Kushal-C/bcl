"use strict";

const utils = require('./utils.js');

/**
 * A transaction is made up of a collection of inputs and outputs.
 * The total value of the outputs must equal or exceed the inputs.
 * 
 * One exception: coinbase transactions have no inputs; Their total
 * outputs should match up with the transaction fees from the
 * transactions in the block, plus an extra reward for for the block
 * itself.
 * 
 * For a transaction, the mining fee is specified as the difference
 * between the total value of the inputs and the total value of the
 * outputs.
 * 
 */
module.exports = class Transaction {

  /**
   * The constructor for a transaction specifies an array of inputs
   * and outputs.  The inputs are optional, in order to support
   * coinbase transactions.
   * 
   * An output is a pair of an amount of coins and the hash of a
   * public key (also called the address), in the form:
   *  {amount, address}
   * 
   * An input is a triple of a transaction ID, the index of an output
   * within that transaction ID, and the public key that matches the
   * hash of the public key from a previous output.  It is in the form:
   *  {txID, outputIndex, pubKey, sig}
   * 
   * @constructor
   * @param {Object} obj - The inputs and outputs of the transaction.
   * @param {Array} obj.outputs - An array of the outputs.
   * @param {Array} obj.inputs - An array of the inputs.
   */
  constructor({outputs, inputs=[]}) {
    this.inputs = inputs;
    this.outputs = outputs;

    // The id is determined at creation and remains constant,
    // even if outputs change.  (This case should only come up
    // with coinbase transactions).
    this.id = utils.hash("" + JSON.stringify({inputs, outputs}));
  }

  /**
   * Validates the input and returns the amount of tokens in the output.
   * If the input is invalid, either due to an invalid signature or due
   * to the wrong transaction ID, an exception is raised.
   * 
   * @param {Object} input - The object representing an input
   */
  spendOutput(input) {
    let {txID, outputIndex, pubKey, sig} = input;
    if (txID !== this.id) {
      throw new Error(`Transaction id of input was ${txID}, but this transaction's id is ${this.id}`);
    }
    let output = this.outputs[outputIndex];
    let {amount, address} = output;
    if (utils.calcAddress(pubKey) !== address) {
      throw new Error(`Public key does not match its hash for tx ${this.id}, output ${outputIndex}.`);
    } else if (!utils.verifySignature(pubKey, output, sig)) {
      throw new Error(`Invalid signature for ${this.id}, outpout ${outputIndex}.`);
    } else {
      return amount;
    }
  }

  /**
   * Validates that a transaction's inputs and outputs are valid.
   * In order to validate a transaction, the map of UTXOs is needed.
   * 
   * A transaction is valid if the sum of the UTXOs matching the inputs
   * must be at least as large as the sum out the outputs.  Also, the
   * signatures of the inputs must be valid and match the address
   * specified in the corresponding UTXOs.
   * 
   * Note that coinbase transactions are **not** valid according to this
   * method, and should not be tested with it.
   * 
   * @param {Object} utxos - The UTXOs matching the inputs.
   * @returns {boolean} True if the transaction is valid, false otherwise.
   */
  isValid(utxos) {

    //
    // **YOUR CODE HERE**
    //
    // Return false if the sum of inputs is less than the sum of outputs.
    //
    // This is more difficult than it sounds, since the inputs do not have
    // a value listed.  In order to calculate their value:
    //
    // 1) Look up the list of UTXOs available for the transaction in the
    //      'utxos' argument.
    // 2) From that list, find the matching utxo.  (If you can't find it,
    //      the transaction is invalid).
    // 3) Verify the public key hash in the previous output matches the
    //      transaction's public key, and that the signature on the UTXO
    //      is valid.
    // 4) From here, you can gather the amount of **input** available to
    //      this transaction.
    /*
    Inputs : [ 
      { 
      txID: '70c1ed2fa3d89d4f71358c4d29be5e2da163a4fc850729f103e3967ca7a3668a',
      outputIndex: 1,
      pubKey: '-----BEGIN RSA PUBLIC KEY-----\nMIIBCgKCAQEA80qhd0p2hhTZ830egKhFFGpHFPbF9E8TrTF8y5GY2dBmMC898dQufzvRMqwF\nK1vaRAgSj6QYp1lnKM8AHHACWudUyFki9Us3Zz3nu5xtvc9apq787ebsaoFzxLyXjbrmwKGc\nMZNNZMybIwjjbqnGowsjyq5cvFSX2xqV9WNMcbz/4sW4OzPop8DQHof9B8sqZO9/esdG7doW\nIe+b0HMLLNEvzvwWTgv0Tk9O6p1czxhuZzjEMDeGE1pdv8u26uv+PIdwItXAjhzF7zx98IF3\neo1Y4ASscZ0WgObUAJVePNKvMV6CVnZ8W2cG8zuJlzYiEM45nIw9Qjav+x7Sru1iHwIDAQAB\n-----END RSA PUBLIC KEY-----\n',
      sig: '94607549767882adf1b0a790ac97f2b93341dd8895056a467263ed8e205659e7c88faa26773026e72c8e1f087d7c64efa2c78d3b9d58968e76ae879624b9866b7aab23bd4aeb62c91ef247fcee2f8e2d1c61bcdaba5d55163281821cb2212317e8d32735360635eed3e10746890b92ce139e6eb945f304b7c00ddca27f6113e83b1c811950fe3ca4951cd2f964193f5cbc28503032e15eda0fb5dc8e3f7835278881f76aa11467eae11eba4d104403a69718600490d6078050e284c7ab1e080af8d95fac58c24e4fae39bfb929914de9a296b901b69c2010e2a27d1b44b893d721d03c109155c2aad2b2b511d7794b3609dbac4ff013e5d8fb31dddaf3adf396' } ]

    Outputs : [ 
      { amount: 20,
      address: 'WhvQQvhWJvG+leLkd1YCSThbOpI+gvUoLPGPqDrzj3o=' },
     { amount: 10,
      address: 'W/c2Ax9d6PuvogoakfTKQJ6jGqEpE1vYtuIeR01v0TY=' } ]

    UTXOS:  { 
      '70c1ed2fa3d89d4f71358c4d29be5e2da163a4fc850729f103e3967ca7a3668a':
        [ { amount: 1,
           address: 'W/c2Ax9d6PuvogoakfTKQJ6jGqEpE1vYtuIeR01v0TY=' },
         { amount: 42,
          address: 'W/c2Ax9d6PuvogoakfTKQJ6jGqEpE1vYtuIeR01v0TY=' } ] }
    */
    let found = false;
    for(let input of this.inputs){
      for(let utxo in utxos){
        for(let obj of utxos[utxo]){
          if(utils.verifySignature(input.pubKey, obj, input.sig)){
            found = true;
          }
        }
      }
    }
    
    return found;

  }

  /**
   * This method is used to give an additional reward to the miner for including a
   * transaction.  All rewards are added to the first output in this transaction.
   * 
   * This should only be called on coinbase transactions.
   * 
   * Also note the this changes the contents, but not the id.  That means that the
   * hash of the transaction and the tranasction ID are no longer connected.
   * 
   * @param {number} amount - The number of coins offered as a miner reward.
   */
  addFee(amount) {
    this.outputs[0].amount += amount;
  }

  /**
   * Calculates the total value of all outputs.
   */
  totalOutput() {
    return this.outputs.reduce(
      (acc, {amount}) => acc + amount,
      0);
  }
}
