actor {

    stable var currentValue: Nat = 0;

    public func greet(name : Text) : async Text {
        return "Hello, " # name # "! I'm backend.";
    };

    public func increment(): async () {
        currentValue += 10;
    };

    public query func getValue(): async Nat {
        currentValue;
    };
};
