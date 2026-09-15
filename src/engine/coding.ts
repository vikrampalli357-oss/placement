import type { CodingProblem, Difficulty } from '../types'

export const CODING_BANK: CodingProblem[] = [
  {
    id: 'py-arr-1',
    title: 'Two Sum',
    language: 'Python',
    topic: 'Arrays',
    difficulty: 'Easy',
    prompt:
      'Given an array of integers nums and an integer target, return the indices of the two numbers that add up to target. Assume exactly one solution exists.',
    examples: ['nums = [2, 7, 11, 15], target = 9 → [0, 1] because 2 + 7 = 9'],
    hints: [
      'Think about the complement: target − current number.',
      'A hash map from value → index lets you check the complement in O(1).',
    ],
    solution: `def two_sum(nums, target):
    seen = {}
    for i, n in enumerate(nums):
        need = target - n
        if need in seen:
            return [seen[need], i]
        seen[n] = i
    return []`,
    complexity: 'Time O(n), extra space O(n).',
  },
  {
    id: 'py-arr-2',
    title: 'Maximum subarray (Kadane)',
    language: 'Python',
    topic: 'Arrays',
    difficulty: 'Medium',
    prompt: 'Find the contiguous subarray with the largest sum and return that sum.',
    examples: ['nums = [-2, 1, -3, 4, -1, 2, 1, -5, 4] → 6  (subarray [4, -1, 2, 1])'],
    hints: [
      'Keep a running sum; reset it when it becomes negative.',
      'Track the best running sum seen so far.',
    ],
    solution: `def max_subarray(nums):
    best = cur = nums[0]
    for x in nums[1:]:
        cur = max(x, cur + x)
        best = max(best, cur)
    return best`,
    complexity: 'Time O(n), extra space O(1).',
  },
  {
    id: 'py-str-1',
    title: 'Valid anagram',
    language: 'Python',
    topic: 'Strings',
    difficulty: 'Easy',
    prompt: 'Return True if string t is an anagram of string s.',
    examples: ['s = "listen", t = "silent" → True'],
    hints: ['Count character frequencies, or sort both strings.'],
    solution: `from collections import Counter

def is_anagram(s, t):
    return Counter(s) == Counter(t)`,
    complexity: 'Time O(n), extra space O(k) for the alphabet.',
  },
  {
    id: 'py-ll-1',
    title: 'Reverse linked list',
    language: 'Python',
    topic: 'Linked Lists',
    difficulty: 'Easy',
    prompt: 'Reverse a singly linked list and return the new head.',
    examples: ['1 → 2 → 3 → None becomes 3 → 2 → 1 → None'],
    hints: ['Use three pointers: prev, curr, nxt.', 'Iterate once; flip curr.next to prev.'],
    solution: `def reverse_list(head):
    prev = None
    curr = head
    while curr:
        nxt = curr.next
        curr.next = prev
        prev = curr
        curr = nxt
    return prev`,
    complexity: 'Time O(n), extra space O(1).',
  },
  {
    id: 'py-dp-1',
    title: 'Climbing stairs',
    language: 'Python',
    topic: 'Basic Dynamic Programming',
    difficulty: 'Easy',
    prompt: 'You can climb 1 or 2 steps. How many distinct ways can you climb n stairs?',
    examples: ['n = 3 → 3 ways (1+1+1, 1+2, 2+1)'],
    hints: ['ways(n) = ways(n-1) + ways(n-2), like Fibonacci.'],
    solution: `def climb(n):
    if n <= 2:
        return n
    a, b = 1, 2
    for _ in range(3, n + 1):
        a, b = b, a + b
    return b`,
    complexity: 'Time O(n), extra space O(1).',
  },
  {
    id: 'java-arr-1',
    title: 'Move zeroes',
    language: 'Java',
    topic: 'Arrays',
    difficulty: 'Easy',
    prompt: 'Move all 0s to the end of an array while keeping the relative order of non-zero elements. Do it in-place.',
    examples: ['[0, 1, 0, 3, 12] → [1, 3, 12, 0, 0]'],
    hints: ['Two pointers: write non-zeros from the left, then fill zeros.'],
    solution: `void moveZeroes(int[] nums) {
    int w = 0;
    for (int i = 0; i < nums.length; i++) {
        if (nums[i] != 0) nums[w++] = nums[i];
    }
    while (w < nums.length) nums[w++] = 0;
}`,
    complexity: 'Time O(n), extra space O(1).',
  },
  {
    id: 'cpp-stack-1',
    title: 'Valid parentheses',
    language: 'C++',
    topic: 'Stack',
    difficulty: 'Easy',
    prompt: 'Given a string containing ()[]{}, return whether it is valid (every open bracket closed in the correct order).',
    examples: ['"([])" → true,  "(]" → false'],
    hints: ['Push opening brackets. On a close, the stack top must be its match.'],
    solution: `bool isValid(string s) {
    stack<char> st;
    for (char c : s) {
        if (c == '(' || c == '[' || c == '{') st.push(c);
        else {
            if (st.empty()) return false;
            char t = st.top(); st.pop();
            if ((c == ')' && t != '(') || (c == ']' && t != '[') || (c == '}' && t != '{'))
                return false;
        }
    }
    return st.empty();
}`,
    complexity: 'Time O(n), extra space O(n).',
  },
  {
    id: 'any-tree-1',
    title: 'Maximum depth of binary tree',
    language: 'Any',
    topic: 'Trees',
    difficulty: 'Easy',
    prompt: 'Return the maximum depth of a binary tree (longest root-to-leaf path, counting nodes).',
    examples: ['A root with two leaves has depth 2.'],
    hints: ['Depth(node) = 1 + max(depth(left), depth(right)). Empty node is 0.'],
    solution: `def max_depth(root):
    if not root:
        return 0
    return 1 + max(max_depth(root.left), max_depth(root.right))`,
    complexity: 'Time O(n), extra space O(h) for recursion height.',
  },
  {
    id: 'py-hash-1',
    title: 'First unique character',
    language: 'Python',
    topic: 'Hashing',
    difficulty: 'Easy',
    prompt: 'Find the first non-repeating character in a string and return its index, or -1 if none.',
    examples: ['"leetcode" → 0 (letter l)'],
    hints: ['Count frequencies first, then scan the string once more.'],
    solution: `from collections import Counter

def first_uniq(s):
    cnt = Counter(s)
    for i, ch in enumerate(s):
        if cnt[ch] == 1:
            return i
    return -1`,
    complexity: 'Time O(n), extra space O(k).',
  },
  {
    id: 'py-rec-1',
    title: 'Binary search',
    language: 'Python',
    topic: 'Searching',
    difficulty: 'Easy',
    prompt: 'Implement binary search on a sorted array. Return the index of target or -1.',
    examples: ['nums = [-1, 0, 3, 5, 9, 12], target = 9 → 4'],
    hints: ['Keep low/high; compare with mid. Avoid infinite loops on low = mid + 1 / high = mid - 1.'],
    solution: `def search(nums, target):
    lo, hi = 0, len(nums) - 1
    while lo <= hi:
        mid = (lo + hi) // 2
        if nums[mid] == target:
            return mid
        if nums[mid] < target:
            lo = mid + 1
        else:
            hi = mid - 1
    return -1`,
    complexity: 'Time O(log n), extra space O(1).',
  },
]

export function pickCodingProblem(opts: {
  language?: 'Python' | 'Java' | 'C++'
  topic?: string
  difficulty?: Difficulty
}): CodingProblem {
  const topic = opts.topic?.toLowerCase()
  let pool = CODING_BANK.filter((p) => {
    if (opts.language && p.language !== 'Any' && p.language !== opts.language) return false
    if (opts.difficulty && p.difficulty !== opts.difficulty && opts.difficulty !== 'Easy') {
      if (!(opts.difficulty === 'Hard' && p.difficulty === 'Medium')) return false
    }
    if (topic && !p.topic.toLowerCase().includes(topic) && !topic.includes(p.topic.toLowerCase().split(' ')[0]!)) {
      return false
    }
    return true
  })
  if (!pool.length) pool = CODING_BANK
  return pool[Math.floor(Math.random() * pool.length)]!
}

export function explainCodeIssue(text: string): { heading: string; body: string; code?: string } {
  const t = text.toLowerCase()
  if (/nameerror/.test(t)) {
    return {
      heading: 'NameError',
      body: 'Python raised NameError because a name is used before it is defined, or it is misspelled. Check spelling, scope (using a variable inside a function that was never assigned), and imports.',
    }
  }
  if (/syntaxerror/.test(t)) {
    return {
      heading: 'SyntaxError',
      body: 'The file is not valid Python. Common campus mistakes: missing colon after if/for/def, unmatched quotes or brackets, using = instead of == in conditions.',
    }
  }
  if (/indentationerror|indent/.test(t)) {
    return {
      heading: 'IndentationError',
      body: 'Python uses indentation instead of braces. Mix of tabs and spaces, or a block that is not indented after a colon, causes this. Use 4 spaces consistently.',
    }
  }
  if (/indexerror/.test(t)) {
    return {
      heading: 'IndexError',
      body: 'You accessed a list index that does not exist (often off-by-one: i == len(a)). Check loop bounds and empty lists.',
    }
  }
  if (/keyerror/.test(t)) {
    return {
      heading: 'KeyError',
      body: 'A dictionary lookup used a key that is not present. Use d.get(key) or `if key in d` before indexing.',
    }
  }
  if (/typeerror/.test(t)) {
    return {
      heading: 'TypeError',
      body: 'An operation was applied to the wrong type (for example adding str and int, or calling a non-callable). Print type(x) around the failing line.',
    }
  }
  if (/zerodivision/.test(t)) {
    return {
      heading: 'ZeroDivisionError',
      body: 'A number was divided by zero. Guard the denominator before dividing.',
    }
  }
  if (/nullpointer|null pointer|npe/i.test(text)) {
    return {
      heading: 'Null / None dereference',
      body: 'In Java this is NullPointerException; in Python accessing an attribute on None. Check that the object exists before use.',
    }
  }
  const hasCode = /def |class |public |#include|console\.|print\(/.test(text)
  if (!hasCode && !/error|exception|traceback/i.test(text)) {
    return {
      heading: 'Need the error text',
      body: 'Paste the traceback or the code snippet. I will not invent a bug that is not in what you sent.',
    }
  }
  return {
    heading: 'Code review (from what you pasted)',
    body: 'I can only comment on the snippet you shared. Typical placement checks: off-by-one in loops, mutating a list while iterating, missing return, and using = instead of ==. Paste the exact error line if you have one.',
    code: text.length < 2000 ? text : undefined,
  }
}
