export default function delayPromise(milliseconds, resolveValue="Time elapsed") {
    return new Promise((resolve, reject) => {
        setTimeout(() => resolve(resolveValue), milliseconds);
      });
}