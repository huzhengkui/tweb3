/*
    This file is part of web3.js.

    web3.js is free software: you can redistribute it and/or modify
    it under the terms of the GNU Lesser General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    web3.js is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU Lesser General Public License for more details.

    You should have received a copy of the GNU Lesser General Public License
    along with web3.js.  If not, see <http://www.gnu.org/licenses/>.
*/
/**
 * @
 * @
 * @date 2015
 */

"use strict";

var formatters = require('../formatters');
var utils = require('../../utils/utils');
var Method = require('../method');
var Property = require('../property');
var c = require('../../utils/config');
var Contract = require('../contract');
var watches = require('./watches');
var Filter = require('../filter');
var IsSyncing = require('../syncing');
var namereg = require('../namereg');
var Iban = require('../iban');
var transfer = require('../transfer');

var blockCall = function (args) {
    return (utils.isString(args[0]) && args[0].indexOf('0x') === 0) ? "tgm_getBlockByHash" : "tgm_getBlockByNumber";
};

var transactionFromBlockCall = function (args) {
    return (utils.isString(args[0]) && args[0].indexOf('0x') === 0) ? 'tgm_getTransactionByBlockHashAndIndex' : 'tgm_getTransactionByBlockNumberAndIndex';
};

var uncleCall = function (args) {
    return (utils.isString(args[0]) && args[0].indexOf('0x') === 0) ? 'tgm_getUncleByBlockHashAndIndex' : 'tgm_getUncleByBlockNumberAndIndex';
};

var getBlockTransactionCountCall = function (args) {
    return (utils.isString(args[0]) && args[0].indexOf('0x') === 0) ? 'tgm_getBlockTransactionCountByHash' : 'tgm_getBlockTransactionCountByNumber';
};

var uncleCountCall = function (args) {
    return (utils.isString(args[0]) && args[0].indexOf('0x') === 0) ? 'tgm_getUncleCountByBlockHash' : 'tgm_getUncleCountByBlockNumber';
};

function Tgm(web3) {
    this._requestManager = web3._requestManager;

    var self = this;

    methods().forEach(function(method) { 
        method.attachToObject(self);
        method.setRequestManager(self._requestManager);
    });

    properties().forEach(function(p) { 
        p.attachToObject(self);
        p.setRequestManager(self._requestManager);
    });


    this.iban = Iban;
    this.sendIBANTransaction = transfer.bind(null, this);
}

Object.defineProperty(Tgm.prototype, 'defaultBlock', {
    get: function () {
        return c.defaultBlock;
    },
    set: function (val) {
        c.defaultBlock = val;
        return val;
    }
});

Object.defineProperty(Tgm.prototype, 'defaultAccount', {
    get: function () {
        return c.defaultAccount;
    },
    set: function (val) {
        c.defaultAccount = val;
        return val;
    }
});

var methods = function () {
    var getBalance = new Method({
        name: 'getBalance',
        call: 'tgm_getBalance',
        params: 2,
        inputFormatter: [formatters.inputAddressFormatter, formatters.inputDefaultBlockNumberFormatter],
        outputFormatter: formatters.outputBigNumberFormatter
    });

    var getStorageAt = new Method({
        name: 'getStorageAt',
        call: 'tgm_getStorageAt',
        params: 3,
        inputFormatter: [null, utils.toHex, formatters.inputDefaultBlockNumberFormatter]
    });

    var getCode = new Method({
        name: 'getCode',
        call: 'tgm_getCode',
        params: 2,
        inputFormatter: [formatters.inputAddressFormatter, formatters.inputDefaultBlockNumberFormatter]
    });

    var getBlock = new Method({
        name: 'getBlock',
        call: blockCall,
        params: 2,
        inputFormatter: [formatters.inputBlockNumberFormatter, function (val) { return !!val; }],
        outputFormatter: formatters.outputBlockFormatter
    });

    var getUncle = new Method({
        name: 'getUncle',
        call: uncleCall,
        params: 2,
        inputFormatter: [formatters.inputBlockNumberFormatter, utils.toHex],
        outputFormatter: formatters.outputBlockFormatter,

    });

    var getCompilers = new Method({
        name: 'getCompilers',
        call: 'tgm_getCompilers',
        params: 0
    });

    var getBlockTransactionCount = new Method({
        name: 'getBlockTransactionCount',
        call: getBlockTransactionCountCall,
        params: 1,
        inputFormatter: [formatters.inputBlockNumberFormatter],
        outputFormatter: utils.toDecimal
    });

    var getBlockUncleCount = new Method({
        name: 'getBlockUncleCount',
        call: uncleCountCall,
        params: 1,
        inputFormatter: [formatters.inputBlockNumberFormatter],
        outputFormatter: utils.toDecimal
    });

    var getTransaction = new Method({
        name: 'getTransaction',
        call: 'tgm_getTransactionByHash',
        params: 1,
        outputFormatter: formatters.outputTransactionFormatter
    });

    var getTransactionFromBlock = new Method({
        name: 'getTransactionFromBlock',
        call: transactionFromBlockCall,
        params: 2,
        inputFormatter: [formatters.inputBlockNumberFormatter, utils.toHex],
        outputFormatter: formatters.outputTransactionFormatter
    });

    var getTransactionReceipt = new Method({
        name: 'getTransactionReceipt',
        call: 'tgm_getTransactionReceipt',
        params: 1,
        outputFormatter: formatters.outputTransactionReceiptFormatter
    });

    var getTransactionCount = new Method({
        name: 'getTransactionCount',
        call: 'tgm_getTransactionCount',
        params: 2,
        inputFormatter: [null, formatters.inputDefaultBlockNumberFormatter],
        outputFormatter: utils.toDecimal
    });

    var sendRawTransaction = new Method({
        name: 'sendRawTransaction',
        call: 'tgm_sendRawTransaction',
        params: 1,
        inputFormatter: [null]
    });

    var sendTransaction = new Method({
        name: 'sendTransaction',
        call: 'tgm_sendTransaction',
        params: 1,
        inputFormatter: [formatters.inputTransactionFormatter]
    });

    var sign = new Method({
        name: 'sign',
        call: 'tgm_sign',
        params: 2,
        inputFormatter: [formatters.inputAddressFormatter, null]
    });

    var call = new Method({
        name: 'call',
        call: 'tgm_call',
        params: 2,
        inputFormatter: [formatters.inputCallFormatter, formatters.inputDefaultBlockNumberFormatter]
    });

    var estimateGas = new Method({
        name: 'estimateGas',
        call: 'tgm_estimateGas',
        params: 1,
        inputFormatter: [formatters.inputCallFormatter],
        outputFormatter: utils.toDecimal
    });

    var compileSolidity = new Method({
        name: 'compile.solidity',
        call: 'tgm_compileSolidity',
        params: 1
    });

    var compileLLL = new Method({
        name: 'compile.lll',
        call: 'tgm_compileLLL',
        params: 1
    });

    var compileSerpent = new Method({
        name: 'compile.serpent',
        call: 'tgm_compileSerpent',
        params: 1
    });

    var submitWork = new Method({
        name: 'submitWork',
        call: 'tgm_submitWork',
        params: 3
    });

    var getWork = new Method({
        name: 'getWork',
        call: 'tgm_getWork',
        params: 0
    });

    var getCoinBasePlotid = new Method({
        name: 'getCoinBasePlotid',
        call: 'tgm_getCoinBasePlotid',
        params: 1
    });

    return [
        getBalance,
        getStorageAt,
        getCode,
        getBlock,
        getUncle,
        getCompilers,
        getBlockTransactionCount,
        getBlockUncleCount,
        getTransaction,
        getTransactionFromBlock,
        getTransactionReceipt,
        getTransactionCount,
        call,
        estimateGas,
        sendRawTransaction,
        sendTransaction,
        sign,
        compileSolidity,
        compileLLL,
        compileSerpent,
        submitWork,
        getWork,
        getCoinBasePlotid
    ];
};


var properties = function () {
    return [
        new Property({
            name: 'coinbase',
            getter: 'tgm_coinbase'
        }),
        new Property({
            name: 'mining',
            getter: 'tgm_mining'
        }),
        new Property({
            name: 'hashrate',
            getter: 'tgm_hashrate',
            outputFormatter: utils.toDecimal
        }),
        new Property({
            name: 'syncing',
            getter: 'tgm_syncing',
            outputFormatter: formatters.outputSyncingFormatter
        }),
        new Property({
            name: 'gasPrice',
            getter: 'tgm_gasPrice',
            outputFormatter: formatters.outputBigNumberFormatter
        }),
        new Property({
            name: 'accounts',
            getter: 'tgm_accounts'
        }),
        new Property({
            name: 'blockNumber',
            getter: 'tgm_blockNumber',
            outputFormatter: utils.toDecimal
        }),
        new Property({
            name: 'protocolVersion',
            getter: 'tgm_protocolVersion'
        })
    ];
};

Tgm.prototype.contract = function (abi) {
    var factory = new Contract(this, abi);
    return factory;
};

Tgm.prototype.filter = function (fil, callback) {
    return new Filter(this._requestManager, fil, watches.tgm(), formatters.outputLogFormatter, callback);
};

Tgm.prototype.namereg = function () {
    return this.contract(namereg.global.abi).at(namereg.global.address);
};

Tgm.prototype.icapNamereg = function () {
    return this.contract(namereg.icap.abi).at(namereg.icap.address);
};

Tgm.prototype.isSyncing = function (callback) {
    return new IsSyncing(this._requestManager, callback);
};

module.exports = Tgm;

