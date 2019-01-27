import sinon from "sinon";
import fire from "../firebase";
import DecisionEngine from "./DecisionEngine";

fire.database().goOffline();

describe('DecisionEngine', () => {

    it('does not return list until all votes are in', () => {
        let session = {hasAllRequiredVotes: () => false};
        let result = DecisionEngine.getSelectedGames(session);
        expect(result).toBeUndefined();
    });
    it('returns ordered games list', () => {
        let mock = sinon.mock(fire);
        mock.expects("database").once().returns({ref: () => ({update: () => true})});

        let votes = {
            "Carla": ["Dominion", "Terraforming Mars", "Evolution"],
            "Dom": ["Aeon's end", "Terraforming Mars", "The Island of El Dorado"],
            "Gilles": ["Terraforming Mars", "Aeon's end", "Forbidden Stars"],
            "Tim": ["Aeon's end", "Evolution", "Go"]
        };
        let expectedSelection = [
            {"game": "Dominion", "score": 3},
            {"game": "Terraforming Mars", "score": 7},
            {"game": "Evolution", "score": 3},
            {"game": "Aeon's end", "score": 8},
            {"game": "The Island of El Dorado", "score": 1},
            {"game": "Forbidden Stars", "score": 1},
            {"game": "Go", "score": 1}
        ];
        let session = {hasAllRequiredVotes: () => true, selectedGames: [], votes, id: "session-id-123"};
        const result = DecisionEngine.getSelectedGames(session);

        mock.verify();
        expect(result).toEqual(expectedSelection);
    });
});