import UIKit
import WebKit

private final class HearthValeViewController: UIViewController, WKNavigationDelegate {
    private var gameWebView: WKWebView!

    override func loadView() {
        let configuration = WKWebViewConfiguration()
        configuration.allowsInlineMediaPlayback = true
        configuration.mediaTypesRequiringUserActionForPlayback = []
        gameWebView = WKWebView(frame: .zero, configuration: configuration)
        gameWebView.navigationDelegate = self
        gameWebView.isOpaque = false
        gameWebView.backgroundColor = UIColor(red: 0.102, green: 0.082, blue: 0.125, alpha: 1)
        gameWebView.scrollView.isScrollEnabled = false
        gameWebView.scrollView.bounces = false
        view = gameWebView
    }

    override func viewDidLoad() {
        super.viewDidLoad()
        let publicDirectory = Bundle.main.bundleURL.appendingPathComponent("public", isDirectory: true)
        let indexURL = publicDirectory.appendingPathComponent("index.html")
        gameWebView.loadFileURL(indexURL, allowingReadAccessTo: publicDirectory)
    }

    override var prefersStatusBarHidden: Bool { true }

    func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) {
        print("HearthVale navigation failed:", error.localizedDescription)
    }

    func webView(
        _ webView: WKWebView,
        didFailProvisionalNavigation navigation: WKNavigation!,
        withError error: Error
    ) {
        print("HearthVale provisional navigation failed:", error.localizedDescription)
    }
}

class SceneDelegate: UIResponder, UIWindowSceneDelegate {
    var window: UIWindow?

    func scene(
        _ scene: UIScene,
        willConnectTo session: UISceneSession,
        options connectionOptions: UIScene.ConnectionOptions
    ) {
        guard let windowScene = scene as? UIWindowScene else { return }

        let window = UIWindow(windowScene: windowScene)
        window.rootViewController = HearthValeViewController()
        self.window = window
        window.makeKeyAndVisible()
    }
}
