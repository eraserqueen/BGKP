const path = require('path');
const fs = require('fs');
const {mapCollectionToGamesList} = require("../bggAdapter");


describe('BGG Adapter', () => {
    describe('mapCollectionToGamesList', () => {
        test('maps invalid collection to empty games list', async () => {
            let actual = await mapCollectionToGamesList("invalid");
            expect(actual).toEqual([]);
        });
        test('maps collection to games list', async () => {
            const collection = JSON.parse(fs.readFileSync(path.join(__dirname, '../__mocks__/getCollectionOkResponse.json'), 'utf8'));
            const expected = [{
                id: 37111,
                title: 'Battlestar Galactica: The Board Game',
                image: 'https://cf.geekdo-images.com/thumb/img/NpZjJd2NgxSJV2WrlB_U1e89txY=/fit-in/200x150/pic354500.jpg',
                minPlayers: 3,
                maxPlayers: 6,
                playingTime: 300
            }];
            await expect(mapCollectionToGamesList(collection)).toEqual(expected);
        });
    });
});
