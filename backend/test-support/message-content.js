// Public Unicode examples; these are message inputs, never credentials.
export const invisibleMessages = [
  '',
  ' \t\n\u3000',
  '\u200b',
  '\u200c\u200d',
  '\u2060\ufeff',
  '\u200e\u200f\u202a\u202c\u2066\u2069',
  '\ufe0e\ufe0f',
  '\u034f',
  '\u00ad',
  '\u0000\u0001\u007f\u0085',
  '\u115f\u1160\u3164\uffa0',
  '\u{e0067}\u{e0062}\u{e007f}',
  ' \n\u200b\u200c\u200d\ufe0f\u2060\t ',
];

export const contentMessages = [
  'ქართული ტექსტი',
  'می\u200cخواهم صحبت کنم',
  'क्\u200dष',
  'e\u0301',
  '👨\u200d👩\u200d👧\u200d👦',
  '👍🏽',
  '❤️',
  '🇬🇪',
  '🏴\u{e0067}\u{e0062}\u{e0065}\u{e006e}\u{e0067}\u{e007f}',
  '  \u200bHello\u200d friend\u200b  ',
  '  A\nB  ',
];
