oneline-view
============

This is an Alfresco Share extension that provides an additional, compact view option for the Document Library. 

To build this, execute the following:

	mvn clean package

This will produce a JAR file that can then be dropped into:

	share/WEB-INF/lib

Note: The oneline-view-repo project is not used, but is included for convenience sake. The online-view-share project is tested using Maven and Jetty, and expects to connect to the Alfresco repository running on port 8080. To test the extension using Maven, first run the repository server:

	oneline-view-repo$ mvn clean integration-test -P webapp

And once the server has started, run the Share server:

	oneline-view-share$ mvn clean integration-test -P webapp

You should then be able to access Alfresco at:

	http://localhost:8081/share
	