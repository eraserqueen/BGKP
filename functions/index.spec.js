const admin = require("firebase-admin");
const sinon = require("sinon");

require('firebase-functions-test')();
const myFunctions = require('./index.js');
const client = require('./bgg/bggClient');
const adapter = require('./bgg/bggAdapter');

describe('functions', () => {
    let dbStub;
    let clientStub;
    let adapterStub;
    let setGamesStub;
    let getPlayersStub;
    let sandbox = sinon.createSandbox();
    sandbox.stub(admin, 'initializeApp');

    describe('synchronizeGameCollection', () => {
        beforeAll(() => {
            setGamesStub = sandbox.stub();
            getPlayersStub = sandbox.stub();
            dbStub = sandbox.stub(admin, 'database').returns({
                ref: () => ({
                    once: getPlayersStub,
                    set: setGamesStub
                })
            });
            clientStub = sandbox.stub(client);
            adapterStub = sandbox.stub(adapter);
        });
        afterAll(() => {
            sandbox.restore();
        });
        // WIP: this test is always green and never finishes
        test.skip('retrieves collection from bgg and maps to local model', async () => {
            getPlayersStub.returns({
                val: () => ({
                    '5': {'bgg-username': 'yassum', username: 'Gilles'},
                    '6': {username: 'Dom'},
                    '7': {username: 'Carla'},
                    '8': {'bgg-username': 'abznak', username: 'Tim'}
                })
            });
            const req = {};
            const res = {
                send: (data) => {
                    expect(data).toEqual('done');
                    expect(getPlayersStub.calledOnce).toBeTruthy();
                    expect(clientStub.getCollectionAsync.calledTwice).toBeTruthy();
                    expect(clientStub.getCollectionAsync.firstCall.args[0]).toEqual('yassum');
                    expect(clientStub.getCollectionAsync.secondCall.args[0]).toEqual('abznak');
                    expect(adapterStub.mapCollectionToGamesList.calledTwice).toBeTruthy();
                    expect(adapterStub.mergeGameLists.calledOnce).toBeTruthy();
                    expect(setGamesStub.calledOnce).toBeTruthy();
                    done();
                }
            };
            await myFunctions.synchronizeGameCollection(req, res);
        });

    });
});