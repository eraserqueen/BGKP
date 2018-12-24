const admin = require("firebase-admin");
const sinon = require("sinon");

require('firebase-functions-test')();
const myFunctions = require('./index.js');
const client = require('./bgg/bggClient');
const adapter = require('./bgg/bggAdapter');

describe('functions', () => {
    let adapterStub;
    let dbStub;
    let clientStub;
    let setStub;
    let sandbox = sinon.createSandbox();

    describe('synchronizeGameCollection', () => {
        beforeAll(() => {
            sandbox.stub(admin, 'initializeApp');
            setStub = sandbox.stub();
            dbStub = sandbox.stub(admin, 'database').returns({ref: {set: setStub}});
            clientStub = sandbox.stub(client, 'getCollectionAsync');
            adapterStub = sandbox.stub(adapter, 'mapCollectionToGamesList');
        });
        afterAll(() => {
            sandbox.restore();
        });
        test('retrieves collection from bgg and maps to local model', async () => {
            clientStub.resolves({});
            adapterStub.returns([]);
            const req = {query: {users: 'yassum'}};
            const res = {
                send: (data) => {
                    expect(data).toEqual('done');
                    expect(clientStub.withArgs('yassum').calledOnce).toBeTruthy();
                    expect(adapterStub.calledOnce).toBeTruthy();
                    expect(setStub.calledOnce).toBeTruthy();
                    done();
                }
            };
            await myFunctions.synchronizeGameCollection(req, res);
        });

    });
});