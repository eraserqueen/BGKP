const admin = require("firebase-admin");
const sinon = require("sinon");

require('firebase-functions-test')();
const myFunctions = require('./index.js');
const client = require('./bgg/bggClient');
const adapter = require('./bgg/bggAdapter');

describe('functions', () => {
    let adapterMock;
    let dbMock;
    let clientMock;
    let setStub;
    let sandbox = sinon.createSandbox();

    beforeAll(() => {
        sandbox.stub(admin, 'initializeApp');
        setStub = sandbox.stub();
        dbMock = sandbox.stub(admin, 'database').returns({ref: {set: setStub}});
        clientMock = sandbox.stub(client, 'getCollectionAsync');
        adapterMock = sandbox.stub(adapter, 'mapCollectionToGamesList');
    });
    afterAll(() => {
        sandbox.restore();
    });
    describe('synchronizeGameCollection', () => {
        it('retrieves collection from bgg and maps to local model', () => {
            clientMock.resolves({});
            adapterMock.returns([]);
            const req = { query: {username: 'yassum'} };
            const res = {
                send: (data) => {
                    expect(data).toEqual('done');
                    expect(clientMock.withArgs('yassum').calledOnce).toBeTruthy();
                    expect(adapterMock.calledOnce).toBeTruthy();
                    expect(setStub.calledOnce).toBeTruthy();
                    done();
                }
            };
            myFunctions.synchronizeGameCollection(req, res);
        });
    });
});