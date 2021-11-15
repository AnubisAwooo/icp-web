actor {
    public func greet(name : Text) : async Text {
        return "Hello, " # name # "! I'm web.";
    };

    stable var currentValue: Nat = 0;

    public func increment(): async () {
        currentValue += 1;
    };

    public query func getValue(): async Nat {
        currentValue;
    };
};
