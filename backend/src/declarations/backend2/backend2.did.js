export const idlFactory = ({ IDL }) => {
  return IDL.Service({
    'getValue' : IDL.Func([], [IDL.Nat], ['query']),
    'greet' : IDL.Func([IDL.Text], [IDL.Text], []),
    'increment' : IDL.Func([], [], []),
  });
};
export const init = ({ IDL }) => { return []; };
