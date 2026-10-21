// Code Talk: explain a C# snippet out loud. Each has a task, key points the
// explanation should hit, and a model explanation.
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else { root.DATA = root.DATA || {}; root.DATA.snippets = factory(); }
})(typeof self !== 'undefined' ? self : this, function () {
  return [
    {
      id: 'sn-async-result', title: 'Blocking on async', level: 1,
      code: `public IActionResult Get(int id)
{
    var order = _repository.GetByIdAsync(id).Result;
    return Ok(order);
}`,
      task: 'Explain what this code does, what is wrong with it, and how you would fix it.',
      keyPoints: [
        { label: 'It blocks the thread waiting for the task', terms: ['block', 'blocking', 'waits', 'synchronously'] },
        { label: 'Sync-over-async: thread pool starvation under load / deadlock risk', terms: ['starvation', 'deadlock', 'thread pool', 'sync over async'] },
        { label: 'Fix: make the action async and await', terms: ['async task', 'await', 'make it async'] },
        { label: 'Exceptions get wrapped in AggregateException', terms: ['aggregateexception', 'aggregate exception', 'wrapped'] },
      ],
      model: "This controller action calls an async repository method and then blocks on dot Result. That's sync-over-async: the request thread sits there doing nothing until the database answers. Under load that leads to thread pool starvation, because every request holds a thread, and in older frameworks with a synchronization context it can deadlock. Also, if the task fails, you get an AggregateException wrapping the real one. The fix is simple: make the action return Task of IActionResult, mark it async, and await the repository call. Same behavior, but the thread is free while the query runs.",
      pt: 'Fale o fluxo: "it calls... then blocks on... under load...". Três frases curtas valem mais que uma longa.',
    },
    {
      id: 'sn-n-plus-one', title: 'Hidden N+1', level: 1,
      code: `var orders = await _db.Orders.ToListAsync();
foreach (var order in orders)
{
    Console.WriteLine($"{order.Id}: {order.Customer.Name}");
}`,
      task: 'What happens at runtime? What is the problem and how do you fix it?',
      keyPoints: [
        { label: 'Customer is a navigation property loaded per iteration (if lazy loading) or null', terms: ['navigation', 'lazy loading', 'null', 'per iteration', 'each order'] },
        { label: 'N+1 queries', terms: ['n+1', 'n plus one', 'one query per'] },
        { label: 'Fix with Include or a projection', terms: ['include', 'projection', 'select'] },
        { label: 'Projection loads only needed columns', terms: ['only the columns', 'dto', 'anonymous type', 'less data'] },
      ],
      model: "The first line loads all orders in one query. Then, inside the loop, it reads order.Customer.Name. Customer is a navigation property: if lazy loading is enabled, every iteration fires another query to load that customer, so for a thousand orders we run a thousand and one queries. If lazy loading is off, Customer is simply null and this throws. Either way it's wrong. The quick fix is Include Customer so EF joins them in one query. The better fix, since we only need the id and the name, is a projection: Select into an anonymous type or a DTO with order.Id and order.Customer.Name. That's one query returning exactly two columns, and no entity tracking.",
      pt: 'Entrevistadores amam esse snippet. Mostre que você sabe que a "melhor" solução é projeção, não Include.',
    },
    {
      id: 'sn-string-loop', title: 'String concatenation in a loop', level: 1,
      code: `string csv = "";
foreach (var item in items)
{
    csv += item.Name + ",";
}
return csv.TrimEnd(',');`,
      task: 'Explain the performance issue and propose an alternative.',
      keyPoints: [
        { label: 'Strings are immutable: each += allocates a new string', terms: ['immutable', 'new string', 'allocat', 'copy'] },
        { label: 'Quadratic cost for large lists', terms: ['quadratic', 'o(n', 'grows', 'large'] },
        { label: 'Use StringBuilder or string.Join', terms: ['stringbuilder', 'string.join', 'join'] },
        { label: 'string.Join is cleaner for this case', terms: ['cleaner', 'readable', 'one line', 'simpler'] },
      ],
      model: "This builds a CSV by concatenating in a loop. Because strings are immutable, every plus-equals allocates a new string and copies the previous content, so the cost grows quadratically with the number of items; for a few items it's irrelevant, for a hundred thousand it's a real problem and a lot of garbage for the GC. For this exact case the cleanest fix is string.Join with a comma over items.Select of the name, which is one allocation and one line, and it also removes the TrimEnd hack. In the general case where I'm building text piece by piece, I'd use a StringBuilder.",
      pt: 'Note a estrutura: o que faz → por que é ruim → solução específica → solução geral.',
    },
    {
      id: 'sn-dispose', title: 'Resource handling', level: 1,
      code: `public string ReadConfig(string path)
{
    var reader = new StreamReader(path);
    var content = reader.ReadToEnd();
    reader.Close();
    return content;
}`,
      task: 'What could go wrong here, and how would you write it?',
      keyPoints: [
        { label: 'If ReadToEnd throws, the reader is never closed: leaked handle', terms: ['exception', 'throws', 'never closed', 'leak', 'handle'] },
        { label: 'Use a using statement/declaration', terms: ['using'] },
        { label: 'Dispose runs even on exceptions (finally)', terms: ['finally', 'even if', 'guarantee'] },
        { label: 'File.ReadAllText is simpler for this case', terms: ['file.readalltext', 'readalltext', 'simpler', 'built-in'] },
      ],
      model: "It opens a file, reads it and closes the reader. The problem is that Close is only reached on the happy path: if ReadToEnd throws, say the file is locked or the disk fails, the StreamReader is never closed and we leak the file handle until the finalizer eventually runs, which can block other processes from accessing the file. The idiomatic fix is a using declaration: using var reader equals new StreamReader, which guarantees Dispose runs in a finally block, even when an exception is thrown. And honestly, for this specific case I'd just call File.ReadAllText, which does all of that for me.",
      pt: '"Happy path" aparece de novo. Use.',
    },
    {
      id: 'sn-captive', title: 'DI lifetime mismatch', level: 2,
      code: `builder.Services.AddDbContext<AppDbContext>();          // scoped
builder.Services.AddSingleton<ReportCache>();

public class ReportCache
{
    private readonly AppDbContext _db;
    public ReportCache(AppDbContext db) => _db = db;
}`,
      task: 'Is there a problem with these registrations? Explain and fix it.',
      keyPoints: [
        { label: 'Captive dependency: scoped DbContext inside a singleton', terms: ['captive', 'scoped', 'singleton'] },
        { label: 'DbContext becomes effectively singleton: not thread-safe, stale data', terms: ['thread-safe', 'thread safe', 'stale', 'lives forever', 'shared across requests'] },
        { label: 'Scope validation throws in development', terms: ['scope validation', 'validatescopes', 'throws at startup', 'development'] },
        { label: 'Fix: inject IServiceScopeFactory or IDbContextFactory and create a scope per use', terms: ['scopefactory', 'scope factory', 'createscope', 'dbcontextfactory', 'context factory'] },
      ],
      model: "Yes, this is a captive dependency. AppDbContext is registered as scoped, one per request, but ReportCache is a singleton, so the first DbContext it receives lives for the whole application. A DbContext isn't thread-safe, so concurrent requests using the cache will corrupt its state, and its change tracker will grow forever and serve stale data. In development the container's scope validation actually throws at startup for this, which is why people sometimes 'fix' it by disabling validation, which is the wrong fix. The right one is to not hold the context: inject IServiceScopeFactory and create a scope each time the cache needs data, or use IDbContextFactory and create a short-lived context inside the method.",
      pt: 'Sabe o nome do problema (captive dependency)? Diga o nome. Nomear o padrão é meio caminho.',
    },
    {
      id: 'sn-multiple-enumeration', title: 'Multiple enumeration', level: 2,
      code: `IEnumerable<Order> pending = _db.Orders.Where(o => o.Status == "Pending");

if (pending.Any())
{
    _logger.LogInformation("{Count} pending orders", pending.Count());
    foreach (var o in pending) Process(o);
}`,
      task: 'How many times does this hit the database? What would you change?',
      keyPoints: [
        { label: 'Three times: Any, Count, foreach', terms: ['three', '3', 'three times', 'three queries'] },
        { label: 'Deferred execution re-runs the query', terms: ['deferred', 'lazy', 're-run', 'runs again', 'each enumeration'] },
        { label: 'Materialize once with ToList', terms: ['tolist', 'materializ', 'once'] },
        { label: 'Data can change between queries (inconsistency)', terms: ['inconsisten', 'change between', 'different results', 'race'] },
      ],
      model: "Because pending is an IQueryable with deferred execution, each operation sends a new query: Any does a SELECT with EXISTS, Count does a SELECT COUNT, and the foreach streams the full rows. So that's three round trips, and since the data can change in between, the count in the log might not match what we actually process. The fix is to materialize once: call ToListAsync, keep the list, then use list.Count and iterate the list. If the list could be huge, I'd keep the Any as a cheap existence check and stream the rest, but I'd drop the separate Count. In general, a method that receives an IEnumerable should assume it can enumerate it only once.",
      pt: 'Resposta começa com o número ("three"). Responder direto e depois explicar é muito valorizado em entrevistas internacionais.',
    },
    {
      id: 'sn-race', title: 'Shared counter', level: 2,
      code: `public class HitCounter
{
    private int _count;
    public void Hit() => _count++;
    public int Count => _count;
}
// registered as singleton, called from many requests`,
      task: 'What is the bug? Give two ways to fix it.',
      keyPoints: [
        { label: '++ is read-modify-write, not atomic: race condition', terms: ['not atomic', 'race', 'read-modify-write', 'lost update', 'three operations'] },
        { label: 'Interlocked.Increment', terms: ['interlocked'] },
        { label: 'lock as alternative', terms: ['lock'] },
        { label: 'Lost increments under concurrency', terms: ['lost', 'lose', 'wrong count', 'less than'] },
      ],
      model: "The bug is that plus-plus looks atomic but it's actually three operations: read the field, add one, write it back. With many requests hitting a singleton at once, two threads can read the same value and both write the same result, so increments get lost and the count is lower than reality. Two fixes: the cheapest is Interlocked.Increment on the field, which is a single atomic CPU instruction and perfect for counters. The more general one is a lock around the increment and the read, which also works when the critical section is bigger than one operation. For a real metric I'd actually use the built-in Meter and Counter APIs, which are thread-safe and exportable.",
      pt: 'Explique "read-modify-write" com os dedos: três passos. Fisicalidade ajuda a fluência.',
    },
    {
      id: 'sn-exception-swallow', title: 'Silent catch', level: 1,
      code: `try
{
    await _paymentGateway.ChargeAsync(order);
}
catch (Exception)
{
    // ignore, we'll retry later
}
order.Status = OrderStatus.Paid;`,
      task: 'Review this code as if it were a pull request.',
      keyPoints: [
        { label: 'Swallows all exceptions including bugs and cancellation', terms: ['swallow', 'ignores', 'hides', 'all exceptions', 'cancellation'] },
        { label: 'Marks the order paid even when the charge failed', terms: ['paid', 'even if', 'failed', 'wrong state', 'inconsistent'] },
        { label: 'Should log, catch specific exceptions, and not proceed', terms: ['log', 'specific', 'return', 'rethrow', 'fail'] },
        { label: 'Retry should be explicit (Polly, outbox, status = PaymentPending)', terms: ['retry', 'polly', 'outbox', 'pending', 'queue'] },
      ],
      model: "I'd block this one. First, the catch swallows every exception, including programming bugs and cancellation, with no logging, so when payments fail nobody will know. Second, and worse, it then marks the order as paid regardless, so a failed charge produces a paid order: that's a data integrity problem with real money. The comment says 'we'll retry later' but nothing schedules a retry. What I'd suggest: catch only the gateway's transient exceptions, log with the order id, set the status to something like PaymentPending, and hand the retry to an explicit mechanism, a Polly policy for immediate retries and a queue or outbox for later ones. And the status should only become Paid after a successful response.",
      pt: 'Fale como revisor: "I\'d block this one", "I\'d suggest". Ordene por gravidade.',
    },
    {
      id: 'sn-switch-expression', title: 'Modern pattern matching', level: 2,
      code: `public decimal Discount(Customer c) => c switch
{
    { Tier: Tier.Gold, YearsActive: > 5 } => 0.20m,
    { Tier: Tier.Gold }                   => 0.15m,
    { Tier: Tier.Silver }                 => 0.10m,
    null                                  => throw new ArgumentNullException(nameof(c)),
    _                                     => 0m
};`,
      task: 'Walk me through this code. What features does it use and do you like it?',
      keyPoints: [
        { label: 'Switch expression returning a value', terms: ['switch expression', 'returns a value', 'expression'] },
        { label: 'Property patterns with relational pattern (> 5)', terms: ['property pattern', 'relational', 'greater than'] },
        { label: 'Order matters: first match wins', terms: ['order', 'first match', 'top to bottom', 'specific first'] },
        { label: 'Discard / null case; compiler warns on non-exhaustive', terms: ['discard', 'underscore', 'null', 'exhaustive', 'default'] },
      ],
      model: "This is a switch expression: it takes the customer and returns a decimal directly, no break statements, no temp variable. Each arm is a property pattern. The first one matches gold customers with more than five years, using a relational pattern inside, and gives twenty percent. The second catches all other gold customers, so order matters: the more specific case has to come first or it would never be reached, and the compiler actually warns about unreachable arms. Silver gets ten percent, null throws, and the underscore is the discard, the fallback for everything else. I like it: it reads like a pricing table, it's exhaustive, and adding a tier is one line. The only thing I'd consider is moving the rules into configuration if the business changes them often.",
      pt: '"Walk me through" = narre linha por linha. Termine com opinião ("I like it because...") e uma ressalva.',
    },
    {
      id: 'sn-record-equality', title: 'Records and equality', level: 2,
      code: `public record Money(decimal Amount, string Currency);

var a = new Money(10, "USD");
var b = new Money(10, "USD");
var c = a with { Amount = 20 };

Console.WriteLine(a == b);
Console.WriteLine(ReferenceEquals(a, b));
Console.WriteLine(c);`,
      task: 'What does this print, and why?',
      keyPoints: [
        { label: 'a == b is True: value equality', terms: ['true', 'value equality', 'by value'] },
        { label: 'ReferenceEquals is False: two objects', terms: ['false', 'different objects', 'two instances', 'reference'] },
        { label: 'with creates a copy; c prints Money { Amount = 20, Currency = USD }', terms: ['with', 'copy', 'amount = 20', 'tostring', 'new instance'] },
        { label: 'Positional record generates ctor, properties, deconstruct', terms: ['positional', 'generated', 'init', 'deconstruct', 'constructor'] },
      ],
      model: "Money is a positional record, so the compiler generates a constructor, init-only properties, value equality, ToString and a Deconstruct method. The first line prints True, because records compare by value and a and b have the same amount and currency. The second prints False: they're still two separate objects on the heap, so reference equality is false. The with-expression creates a new Money copying a but with amount twenty, and the generated ToString prints something like Money, Amount equals 20, Currency equals USD. This is exactly why records are great for value objects: equality and immutability come for free, and I didn't have to override Equals and GetHashCode by hand.",
      pt: 'Responda primeiro as três saídas, depois o porquê. Entrevistador agradece.',
    },
    {
      id: 'sn-cancellation', title: 'Cancellation plumbing', level: 2,
      code: `app.MapGet("/report", async (ReportService svc) =>
{
    var data = await svc.BuildAsync();
    return Results.Ok(data);
});

public async Task<Report> BuildAsync()
{
    var rows = await _db.Rows.ToListAsync();
    await _http.GetAsync("https://api.example.com/rates");
    return Compose(rows);
}`,
      task: 'What is missing here and why does it matter?',
      keyPoints: [
        { label: 'No CancellationToken is passed through', terms: ['cancellationtoken', 'cancellation token', 'token'] },
        { label: 'If the client disconnects, work continues and wastes resources', terms: ['disconnect', 'client gives up', 'wasted', 'keeps running', 'abandon'] },
        { label: 'Minimal API injects HttpContext.RequestAborted token automatically', terms: ['requestaborted', 'inject', 'parameter', 'automatically', 'minimal api'] },
        { label: 'Pass it to ToListAsync and GetAsync', terms: ['pass it', 'tolistasync', 'getasync', 'all the way down', 'through'] },
      ],
      model: "What's missing is cancellation. Nothing here takes a CancellationToken, so if the user closes the browser while the report is building, the database query and the HTTP call keep running to completion, holding a connection and a thread pool slot for a result nobody will read. Under load that's a real cost. In a minimal API I just add a CancellationToken parameter to the handler and the framework binds it to HttpContext.RequestAborted. Then I pass it all the way down: BuildAsync takes a token, ToListAsync gets it, GetAsync gets it. Cancellation in .NET is cooperative, so it only works if every layer forwards the token. I'd also make the analyzer rule for missing tokens a warning in the project.",
      pt: 'Palavra: cooperative. "Pass it all the way down" é a expressão para explicar o encadeamento.',
    },
    {
      id: 'sn-primary-ctor', title: 'Reading modern C#', level: 1,
      code: `public sealed class OrderService(IOrderRepository repo, ILogger<OrderService> logger)
{
    public async Task<Result<Order>> CreateAsync(CreateOrder cmd, CancellationToken ct)
    {
        if (cmd.Lines is [])
            return Result<Order>.Failure("Order must have at least one line.");

        var order = Order.Create(cmd.CustomerId, cmd.Lines);
        await repo.AddAsync(order, ct);
        logger.LogInformation("Created order {OrderId}", order.Id);
        return Result<Order>.Success(order);
    }
}`,
      task: 'Explain this class to a colleague who last used C# 7.',
      keyPoints: [
        { label: 'Primary constructor captures dependencies', terms: ['primary constructor', 'constructor parameters', 'captured', 'no fields'] },
        { label: 'List pattern [] checks for empty', terms: ['list pattern', 'empty', 'square brackets', 'pattern'] },
        { label: 'Result type instead of exceptions for expected failures', terms: ['result', 'instead of exception', 'expected failure', 'validation'] },
        { label: 'Factory method on the aggregate; structured logging template', terms: ['factory', 'order.create', 'structured', 'template', 'aggregate'] },
      ],
      model: "A few newer features here. The class header has a primary constructor: the parameters repo and logger are captured and usable anywhere in the class, so there are no explicit fields and no assignments; that's C# 12. In the method, cmd.Lines is open-close square brackets is a list pattern that matches an empty collection, C# 11. Instead of throwing for an invalid command, it returns a Result type with a failure message, treating validation as an expected outcome rather than an exception. Then it creates the order through a static factory on the domain class, so the invariants live in Order, not here; saves it with the cancellation token; and logs with a structured template, OrderId as a named property. The class is sealed, which is a small habit that helps the JIT and signals that it isn't meant to be inherited.",
      pt: 'Esse exercício é sobre explicar com clareza, não sobre achar bug. Ritmo calmo, uma feature por frase.',
    },
  ];
});
